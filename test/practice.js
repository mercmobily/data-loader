async function practiceCode (p) {
  const defaultConfig = p.defaultConfig
  const locationMatch = p.locationMatch
  const tony = { name: 'Tony', surname: 'Mobily', id: 0 }  
  const chiara = { name: 'Chiara', surname: 'Fabbietti', id: 1 }

  /* ********************************************************* */
  /* *     PRACTICE CODE HERE (from documentaiton)           * */
  /* ********************************************************* */

  global.window = { location: { pathname: '/view-users/1' } }
  let params = locationMatch('/view-users/:userId')
  
  console.log('URL RESOLUTION:')
  console.log(params)
  
  let r = await loader(
    '/users/:userId', 
    params,
    false,
    {},
    defaultConfig
  )
  
  console.log('LOADER RESULT:')
  console.log(r)

  /* ********************************************************* */
  /* *     END OF PRACTICE CODE                              * */
  /* ********************************************************* */

}

/*
  This function will run at startup, and will create a server with testing
  data (inspired by the data in tests). Once the server is up,
  it runs the practiceCode() function, with `locationMatch` and `defaultConfig`
  as parameters (they are both needed to run the test code)
*/
async function run () {
  const express = require('express')
  const http = require('http')
  const JsonRestStores = require('jsonreststores')
  const fetch = require('cross-fetch')
  const locationMatch = (await import('../node_modules/routify/routify.js')).locationMatch
  loader = (await import('../index.js')).loader

  const app = express()
  JsonRestStores.requireStoresFromPath('stores', app)
  const server = http.createServer(app)

  users = JsonRestStores.stores('1.0.0').users
  addresses = JsonRestStores.stores('1.0.0').addresses
  tags = JsonRestStores.stores('1.0.0').tags

  await users.implementInsert({ body: { name: 'Tony', surname: 'Mobily', id: 0 } })
  await users.implementInsert({ body: { name: 'Chiara', surname: 'Fabbietti', id: 1 } })
  await users.implementInsert({ body: { name: 'Julian', surname: 'Mobily', id: 2 }})
  await users.implementInsert({ body: { name: 'Reuben', surname: 'Mobily', id: 3 }})

  await addresses.implementInsert({ body: { id: 0, userId: 0, line1: 'Tony Address 0' }})
  await addresses.implementInsert({ body: { id: 1, userId: 0, line1: 'Tony Address 1' }})
  await addresses.implementInsert({ body: { id: 2, userId: 0, line1: 'Tony Address 2' }})
  await addresses.implementInsert({ body: { id: 3, userId: 0, line1: 'Tony Address 3' }})

  await addresses.implementInsert({ body: { id: 4, userId: 1, line1: 'Chiara Address 0' }})
  await addresses.implementInsert({ body: { id: 5, userId: 1, line1: 'Chiara Address 1' }})
  await addresses.implementInsert({ body: { id: 6, userId: 1, line1: 'Chiara Address 2' }})
  await addresses.implementInsert({ body: { id: 7, userId: 1, line1: 'Chiara Address 3' }})

  await tags.implementInsert({ body: { id: 0, userId: 0, name: 'Tony Tag 0' }})
  await tags.implementInsert({ body: { id: 1, userId: 0, name: 'Tony Tag 1' }})
  await tags.implementInsert({ body: { id: 2, userId: 0, name: 'Tony Tag 2' }})
  await tags.implementInsert({ body: { id: 3, userId: 0, name: 'Tony Tag 3' }})

  await tags.implementInsert({ body: { id: 4, userId: 1, name: 'Chiara Tag 0' } })
  await tags.implementInsert({ body: { id: 5, userId: 1, name: 'Chiara Tag 1' }})
  await tags.implementInsert({ body: { id: 6, userId: 1, name: 'Chiara Tag 2' }})
  await tags.implementInsert({ body: { id: 7, userId: 1, name: 'Chiara Tag 3' }})  

  server.listen({ port: 0 }, async () => {
    const port = await server.address().port
    await practiceCode({
      locationMatch,
      defaultConfig: {
        storeUrlPrefix: `http://127.0.0.1:${port}/stores/1.0.0`,
        aggressiveLoading: false,
        fetch,
        verbose: true
      }
    })
    await server.close()
  })
  
    
}

run()