const express = require('express')
const http = require('http')
const JsonRestStores = require('jsonreststores')
const fetch = require('cross-fetch')

function startServer () {
  return new Promise((resolve) => {
    const app = express()
    var server = http.createServer(app)

    server.listen({ port: 0 }, () => {
      JsonRestStores.requireStoresFromPath('stores', app)
      resolve(server)
    })
    
  })
}

async function run() {
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

  loader = (await import('../index.js')).loader
  const locationMatch = (await import('../node_modules/routify/routify.js')).locationMatch

  tony = { name: 'Tony', surname: 'Mobily', id: 0 }
  chiara = { name: 'Chiara', surname: 'Fabbietti', id: 1 }
  chiaraTag4 = { id: 4, userId: 1, name: 'Chiara Tag 0' }
  _chiaraAddress4 = { id: 4, userId: 1, line1: 'Chiara Address 0' }
  chiaraAddress4 = { id: 4, userId: 1, line1: 'Chiara Address 0', userIdRecord: chiara }

  server = await startServer()

  port = server.address().port
  url = `http://127.0.0.1:${port}/`
  defaultConfig = {
    storeUrlPrefix: `http://127.0.0.1:${port}/stores/1.0.0`,
    aggressiveLoading: false,
    fetch,
    verbose: true
  }

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


  await practiceCode()
  await server.close()


  async function practiceCode() {
    /* Add your practice code here */


    global.window = { location: { pathname: '/view-tags/5' } }
    let params = locationMatch('/view-tags/:tagId')
    
    console.log('URL RESOLUTION:')
    console.log(params)
    
    const r = await loader(
      '/users/:userId/tags/:tagId', 
      params,
      false,
      { userIdRecord: chiara },
      defaultConfig
    )

    console.log('LOADER RESULT:')
    console.log(r)

  

    /*
    global.window = { location: { pathname: '/view-users/1/view-tags/4' } }
    let params = locationMatch('/view-users/:userId/view-tags/:tagId')
    
    console.log('URL RESOLUTION:')
    console.log(params)
    
    const r = await loader(
      '/users/:userId/tags/:tagId', 
      params,
      false,
      { },
      defaultConfig
    )

    console.log('LOADER RESULT:')
    console.log(r)
*/

/*
    global.window = { location: { pathname: '/user/1/address/2' } }
    let params = locationMatch('/user/:userId', () => true, true)
  
    const r = await loader(
      '/users/:userId', 
      params,
      false,
      {},
      defaultConfig
    )
    console.log(r)
    */  
  }
}

run()