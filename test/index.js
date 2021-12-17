const chai = require('chai')
const express = require('express')
const http = require('http')
const path = require('path')
const JsonRestStores = require('jsonreststores')
const fetch = require('cross-fetch')

// chai.should()
const expect = chai.expect

function startServer () {
  return new Promise((resolve) => {
    // Serve static files in `public` (the whole client-side app)
    const app = express()

    app.use('/', express.static(path.join(__dirname, 'www')))
    var server = http.createServer(app)

    server.listen({ port: 0 }, () => {
      resolve(server)
    })
    console.log(__dirname)
    
    JsonRestStores.requireStoresFromPath(path.join(__dirname, 'stores'), app)
  })
}

function sleep (ms) { // eslint-disable-line no-unused-vars
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe(`Initialising tiny memory data server`, async function () {
  let server
  let port
  let url

  let users
  let addresses
  let tags
  let loader  

  let tony = { name: 'Tony', surname: 'Mobily', id: 0 }
  let chiara = { name: 'Chiara', surname: 'Fabbietti', id: 1 }
  let chiaraTag = { id: 4, userId: 1, name: 'Chiara Tag 0' }
  let _chiaraAddress = { id: 4, userId: 1, line1: 'Chiara Address 0' }
  let chiaraAddress = { id: 4, userId: 1, line1: 'Chiara Address 0', userIdRecord: chiara }

  before(async function () {
    server = await startServer()
    port = server.address().port
    url = `http://127.0.0.1:${port}/`
    
    ;({ loader } = await import('../index.js'))

    defaultConfig = {
      storeUrlPrefix: `http://127.0.0.1:${port}/1.0.0`,
      aggressiveLoading: false,
      fetch 
    }

    // console.log('Port is:', port)


    users = JsonRestStores.stores('1.0.0').users
    addresses = JsonRestStores.stores('1.0.0').addresses
    tags = JsonRestStores.stores('1.0.0').tags


    
    await users.implementInsert({ body: tony })
    await users.implementInsert({ body: chiara })
    await users.implementInsert({ body: { name: 'Julian', surname: 'Mobily', id: 2 }})
    await users.implementInsert({ body: { name: 'Reuben', surname: 'Mobily', id: 3 }})

    await addresses.implementInsert({ body: { id: 0, userId: 0, line1: 'Tony Address 0' }})
    await addresses.implementInsert({ body: { id: 1, userId: 0, line1: 'Tony Address 1' }})
    await addresses.implementInsert({ body: { id: 2, userId: 0, line1: 'Tony Address 2' }})
    await addresses.implementInsert({ body: { id: 3, userId: 0, line1: 'Tony Address 3' }})

    await addresses.implementInsert({ body: _chiaraAddress })
    await addresses.implementInsert({ body: { id: 5, userId: 1, line1: 'Chiara Address 1' }})
    await addresses.implementInsert({ body: { id: 6, userId: 1, line1: 'Chiara Address 2' }})
    await addresses.implementInsert({ body: { id: 7, userId: 1, line1: 'Chiara Address 3' }})

    await tags.implementInsert({ body: { id: 0, userId: 0, name: 'Tony Tag 0' }})
    await tags.implementInsert({ body: { id: 1, userId: 0, name: 'Tony Tag 1' }})
    await tags.implementInsert({ body: { id: 2, userId: 0, name: 'Tony Tag 2' }})
    await tags.implementInsert({ body: { id: 3, userId: 0, name: 'Tony Tag 3' }})

    await tags.implementInsert({ body: chiaraTag })
    await tags.implementInsert({ body: { id: 5, userId: 1, name: 'Chiara Tag 1' }})
    await tags.implementInsert({ body: { id: 6, userId: 1, name: 'Chiara Tag 2' }})
    await tags.implementInsert({ body: { id: 7, userId: 1, name: 'Chiara Tag 3' }})

    /*
    debugger

    let u0 = await users.implementFetch({ params: { id: 0 } })
    let a0 = await addresses.implementFetch({ params: { id: 0 } })

    let as0 = await addresses.implementQuery({ options: { conditionsHash: { userId: 0 } } })
    let as1 = await addresses.implementQuery({ options: { conditionsHash: { userId: 1 } } })

    const res = await fetch(`http://127.0.0.1:${port}/1.0.0/users/1`)
    const data = await res.text()
    console.log(data)
    */
    
    return
  })

  // Close things up
  after(async function () {
    await server.close()
    // console.log('c')
  })

  // ***********************************************
  // ************ BASIC NON-ELEMENT CALLS **********
  // ***********************************************

  describe(`All tests starting`, async function () {
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
      expect(r).to.have.nested.deep.property('loadedElementData.tagIdRecord', chiaraTag)
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
      expect(r).to.have.nested.deep.property('loadedElementData.addressIdRecord', chiaraAddress)
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
      expect(r).to.have.nested.deep.property('loadedElementData.tagIdRecord', chiaraTag)
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
      expect(r).to.have.nested.deep.property('loadedElementData.addressIdRecord', chiaraAddress)
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
      expect(r).to.have.nested.deep.property('loadedElementData.addressIdRecord', chiaraAddress)
    })


    it('2 params, no fetching required since object already has userIdRecord and addressIdRecord', async function () {
      
      const r = await loader(
        '/users/:userId/addresses/:addressId', 
        { addressId: 4 },
        false,
        { userIdRecord: chiara, addressIdRecord: chiaraAddress},
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
