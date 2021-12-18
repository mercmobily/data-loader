// # Test suite for data-loader
//
// In order to check that things work properly, the testing process needs to be passed specific URLs,
// and check what calls are being made -- and what data is being returned
// 
// To achieve this, JsonRestStores is the easiest way to achieve this. So, the helicopter-view of
// the system uses Mocha to run the tests, chai's `expect` to check values, and JsonRestStores
// with three stores, `people`, `addresses` and `tags`, where each person can have several addresses
// and several tags. Note that while addresses will include `personIdRecord` with the full record of
// the person, `tags` won't.
//
// First of all, all of the needed external libraries are loaded.

const chai = require('chai')
const express = require('express')
const http = require('http')
const path = require('path')
const JsonRestStores = require('jsonreststores')
const fetch = require('cross-fetch')
const expect = chai.expect


// The next step is to actually have a function that will start the server. This function
// returns a promise that gets resolved once the server is listening.
// Since Express works with callbacks, the only way to make it work neatly with an `await`
//
// Once the server has started, JsonRestStore's function `requireStoresFromPath()` is run, and
// the three memory store files `Users.js`, `Addresses.js` and `Tags.js` are loaded. They are
// fully functional REST stores, which are ready to store and return data.
function startServer () {
  return new Promise((resolve) => {
    const app = express()
    var server = http.createServer(app)

    server.listen({ port: 0 }, () => {
      JsonRestStores.requireStoresFromPath('test/stores', app)
      resolve(server)
    })
    
  })
}

// Tests start here. The first suite is the root one; it will have all of the
// test-wide variables, which will (or might) be used by pretty much all tests

describe(`Initialising tiny memory data server`, async function () {
  let server
  let port
  let url

  let users
  let addresses
  let tags
  let loader  

  let tony
  let chiara
  let chiaraTag4
  let _chiaraAddress4
  let chiaraAddress4


// # Prep work
//
// The next section is what happens before running _all_ tests.
// Some common pre-records are defined, the server is actually started (calling the
// previously defined function `startServer()`) and the JsonRestStore memory stores are
// filled with realistic data
// In detail...

  before(async function () {

// The loader is defined. This variable is especially important, since
// this is the function that is effectively the actual target of every single test.
    loader = (await import('../index.js')).loader

// The next step is to define four records which will be used extensively during tests.
// Note that `_chiaraAddress4` (with an underscore) is used to _add_ the record, whereas
// `chiaraAddress4` is used to compare it with the result of a fetch (which, in case of
// addresses, will also include the full `person` record under the property `userIdRecord`)
    tony = { name: 'Tony', surname: 'Mobily', id: 0 }
    chiara = { name: 'Chiara', surname: 'Fabbietti', id: 1 }
    chiaraTag4 = { id: 4, userId: 1, name: 'Chiara Tag 0' }
    _chiaraAddress4 = { id: 4, userId: 1, line1: 'Chiara Address 0' }
    chiaraAddress4 = { id: 4, userId: 1, line1: 'Chiara Address 0', userIdRecord: chiara }

// The server is started by using the previously declared function
    server = await startServer()

// The main aim of the next chunk of code is to create `defaultConfig`, which will be
// the default configuration used by `loader`. It defines the correct prefix to make
// requests to the right address and port, and will pass `cross-fetch` as the
// fetching function
    port = server.address().port
    url = `http://127.0.0.1:${port}/`
    defaultConfig = {
      storeUrlPrefix: `http://127.0.0.1:${port}/1.0.0`,
      aggressiveLoading: false,
      fetch 
    }

// The next three variables represents the three stores used in the tests:
// `users`, `addresse` and `tags`
    users = JsonRestStores.stores('1.0.0').users
    addresses = JsonRestStores.stores('1.0.0').addresses
    tags = JsonRestStores.stores('1.0.0').tags
 
// The next step in this huge prep is to actualy populate the stores.
// Note that in some cases the "common" records are used
    await users.implementInsert({ body: tony })
    await users.implementInsert({ body: chiara })
    await users.implementInsert({ body: { name: 'Julian', surname: 'Mobily', id: 2 }})
    await users.implementInsert({ body: { name: 'Reuben', surname: 'Mobily', id: 3 }})

    await addresses.implementInsert({ body: { id: 0, userId: 0, line1: 'Tony Address 0' }})
    await addresses.implementInsert({ body: { id: 1, userId: 0, line1: 'Tony Address 1' }})
    await addresses.implementInsert({ body: { id: 2, userId: 0, line1: 'Tony Address 2' }})
    await addresses.implementInsert({ body: { id: 3, userId: 0, line1: 'Tony Address 3' }})

    await addresses.implementInsert({ body: _chiaraAddress4 })
    await addresses.implementInsert({ body: { id: 5, userId: 1, line1: 'Chiara Address 1' }})
    await addresses.implementInsert({ body: { id: 6, userId: 1, line1: 'Chiara Address 2' }})
    await addresses.implementInsert({ body: { id: 7, userId: 1, line1: 'Chiara Address 3' }})

    await tags.implementInsert({ body: { id: 0, userId: 0, name: 'Tony Tag 0' }})
    await tags.implementInsert({ body: { id: 1, userId: 0, name: 'Tony Tag 1' }})
    await tags.implementInsert({ body: { id: 2, userId: 0, name: 'Tony Tag 2' }})
    await tags.implementInsert({ body: { id: 3, userId: 0, name: 'Tony Tag 3' }})

    await tags.implementInsert({ body: chiaraTag4 })
    await tags.implementInsert({ body: { id: 5, userId: 1, name: 'Chiara Tag 1' }})
    await tags.implementInsert({ body: { id: 6, userId: 1, name: 'Chiara Tag 2' }})
    await tags.implementInsert({ body: { id: 7, userId: 1, name: 'Chiara Tag 3' }})  

    /*
    // Uncomment this chunk and add your own code for learning purposes
    process.exit(1)
    */
  })

// The code above will be execute _before_ each tests. In this case, all that is 
// needed is the closure of the server
  after(async function () {

    /* Add your own code here to play around */
    await server.close()
  })


// # Actual tests
// 
// After all that prep, everything is ready to actually run tests.
//   
  describe(`All tests starting`, async function () {

// Each test starts with a call to `loader()` and then checking the end results.
//
// This first test for example will simply load data with a straight 1-parameter URL. The location in the
// browser could be http://example.com/users/1.
//
// In the loader:
//  - the first parameter is the URL, the second parameter is an object with the 
//  - the second parameter is the list of paramters from the URL (for example if the URL was /users/:userId)
//  - The third parameter indicates that it's _not_ a list (since it's `false`)
//  - The fourth parameter is the "existing data" -- if the property `userIdRecord` were already defined,
//    then it won't be loaded 
//  - The fifth parameter is the default config, defined earlier (with the URL prefix, the fetching function, etc.)
// 
// Each test is self-explanatory, thanks to the very verbose nature of `expect`
//
    it('1 param, fetched', async function () {

      const r = await loader(
        '/users/:userId', 
        { userId: 1 },
        false,
        {},
        defaultConfig
      )

      expect(r).to.have.nested.deep.property('loadedElementData.userIdRecord', chiara)
      expect(r.totalLoads).to.be.a('number').to.equal(1)
    })


    it('1 param, no fetching since dataElement already has userIdRecord', async function () {
      
      const r = await loader(
        '/users/:userId', 
        { userId: 1 },
        false,
        {userIdRecord: chiara},
        defaultConfig
      )

      expect(r.totalLoads).to.be.a('number').to.equal(0)
    })


    it('2 params, two fetch calls', async function () {
      
      const r = await loader(
        '/users/:userId/tags/:tagId', 
        { userId: 1, tagId: 4 },
        false,
        {},
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').to.equal(2)
      expect(r).to.have.nested.deep.property('loadedElementData.userIdRecord', chiara)
      expect(r).to.have.nested.deep.property('loadedElementData.tagIdRecord', chiaraTag4)
    })


    it('2 params, only one fetch thanks to userIdRecord entry in address', async function () {
      
      const r = await loader(
        '/users/:userId/addresses/:addressId', 
        { userId: 1, addressId: 4 },
        false,
        {},
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').to.equal(1)
    })


    it('2 params, userId missing from URL, but fished out of (fetched) addressIdRecord which included userIdRecord, only 1 call', async function () {
      
      const r = await loader(
        '/users/:userId/addresses/:addressId', 
        { addressId: 4 },
        false,
        {},
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').to.equal(1)
      expect(r).to.have.nested.deep.property('loadedElementData.userIdRecord', chiara)
      expect(r).to.have.nested.deep.property('loadedElementData.addressIdRecord', chiaraAddress4)
    })
    
    it('2 params, userId missing from URL, but fished out of (fetched) tagIdRecord; 2 calls since no userIdRecord in tagIdRecord', async function () {
      
      const r = await loader(
        '/users/:userId/tags/:tagId', 
        { tagId: 4 },
        false,
        { },
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').to.equal(2)
      expect(r).to.have.nested.deep.property('loadedElementData.userIdRecord', chiara)
      expect(r).to.have.nested.deep.property('loadedElementData.tagIdRecord', chiaraTag4)
    })

    it('2 params, 2 PARALLEL fetch calls (aggressiveLoading is true)', async function () {
      
      const r = await loader(
        '/users/:userId/addresses/:addressId', 
        { userId: 1, addressId: 4 },
        false,
        { },
        { ...defaultConfig, aggressiveLoading: true }
      )
      expect(r.totalLoads).to.be.a('number').to.equal(2)
      expect(r).to.have.nested.deep.property('loadedElementData.userIdRecord', chiara)
      expect(r).to.have.nested.deep.property('loadedElementData.addressIdRecord', chiaraAddress4)
    })

    it('2 params, 1 fetch call (since addressIdRecord includes userIdRecord)', async function () {

      const r = await loader(
        '/users/:userId/addresses/:addressId', 
        { userId: 1, addressId: 4 },
        false,
        { },
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').to.equal(1)
      expect(r).to.have.nested.deep.property('loadedElementData.userIdRecord', chiara)
      expect(r).to.have.nested.deep.property('loadedElementData.addressIdRecord', chiaraAddress4)
    })


    it('2 params, no fetching required since object already has userIdRecord and addressIdRecord', async function () {
      
      const r = await loader(
        '/users/:userId/addresses/:addressId', 
        { addressId: 4 },
        false,
        { userIdRecord: chiara, addressIdRecord: chiaraAddress4},
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').to.equal(0)
      expect(r).not.to.have.nested.property('loadedElementData.userIdRecord')
      expect(r).not.to.have.nested.property('loadedElementData.addressIdRecord')
    })

    it('1 param, with list at the end', async function () {
      
      const r = await loader(
        '/users/:userId/addresses', 
        { userId: 1 },
        true,
        { },
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').to.equal(1)
      expect(r).to.have.nested.property('loadedElementData.userIdRecord')
      expect(r).to.have.nested.property('loadedElementData.addressesList')
      expect(r.loadedElementData.addressesList).to.be.an('array').lengthOf(4);
    })

    it('1 param, with list at the end, no need to load parameter', async function () {
      
      const r = await loader(
        '/users/:userId/addresses', 
        { userId: 1 },
        true,
        { userIdRecord: chiara},
        defaultConfig
      )
      expect(r.totalLoads).to.be.a('number').and.equal(0)
      expect(r).not.to.have.nested.property('loadedElementData.userIdRecord')
      expect(r).to.have.nested.property('loadedElementData.addressesList')
      expect(r.loadedElementData.addressesList).to.be.an('array').lengthOf(4);
    })


    it('Not enough information 1', async function () {
      const consoleErr = console.error
      console.error = () => {}
      try {
        const r = await loader(
          '/users/:userId/tags/:tagId', 
          { userId: 4 },
          false,
          { },
          defaultConfig
        )
      } catch (e) {
        expect(e.message).to.have.string('Not enough')
      }
      console.error = consoleErr
    })

    it('Not enough information 2', async function () {
      const consoleErr = console.error
      console.error = () => {}
      try {
        const r = await loader(
          '/users/:userId/tags/:tagId', 
          { },
          false,
          { },
          defaultConfig
        )
      } catch (e) {
        expect(e.message).to.have.string('Not enough')
      }
      console.error = consoleErr
    })

    /*
    expect(r).to.include.nested.property('loadedElementData.userIdRecord')
    expect(r.loadedElementData.userIdRecord).to.include({ id: 1 })
    */
  })

})
