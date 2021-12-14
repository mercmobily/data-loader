const chai = require('chai')
const express = require('express')
const http = require('http')
const path = require('path')
const JsonRestStores = require('jsonreststores')

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

describe(`Start all tests`, async function () {
  var server
  var port
  var url

  console.log('a')
  
  before(async function () {
    server = await startServer()
    port = server.address().port
    url = `http://127.0.0.1:${port}/`

    console.log('Port is:', port)

    const users = JsonRestStores.stores('1.0.0').users
    const addresses = JsonRestStores.stores('1.0.0').addresses
    const tags = JsonRestStores.stores('1.0.0').tags

    await users.implementInsert({ body: { name: 'Tony', surname: 'Mobily', id: 0 }})
    await users.implementInsert({ body: { name: 'Chiara', surname: 'Fabbietti', id: 1 }})
    await users.implementInsert({ body: { name: 'Julian', surname: 'Mobily', id: 2 }})
    await users.implementInsert({ body: { name: 'Reuben', surname: 'Mobily', id: 3 }})

    await addresses.implementInsert({ body: { id: '0', userId: 0, line1: 'Tony Address 0' }})
    await addresses.implementInsert({ body: { id: '1', userId: 0, line1: 'Tony Address 1' }})
    await addresses.implementInsert({ body: { id: '2', userId: 0, line1: 'Tony Address 2' }})
    await addresses.implementInsert({ body: { id: '3', userId: 0, line1: 'Tony Address 3' }})

    await addresses.implementInsert({ body: { id: '4', userId: 1, line1: 'Chiara Address 0' }})
    await addresses.implementInsert({ body: { id: '5', userId: 1, line1: 'Chiara Address 1' }})
    await addresses.implementInsert({ body: { id: '6', userId: 1, line1: 'Chiara Address 2' }})
    await addresses.implementInsert({ body: { id: '7', userId: 1, line1: 'Chiara Address 3' }})

    await tags.implementInsert({ body: { id: '0', userId: 0, name: 'Tony Tag 0' }})
    await tags.implementInsert({ body: { id: '1', userId: 0, name: 'Tony Tag 1' }})
    await tags.implementInsert({ body: { id: '2', userId: 0, name: 'Tony Tag 2' }})
    await tags.implementInsert({ body: { id: '3', userId: 0, name: 'Tony Tag 3' }})

    debugger

    let u0 = await users.implementFetch({ params: { id: 0 } })
    let a0 = await addresses.implementFetch({ params: { id: 0 } })

    let as0 = await addresses.implementQuery({ options: { conditionsHash: { userId: 0 } } })
    let as1 = await addresses.implementQuery({ options: { conditionsHash: { userId: 1 } } })


    return
  })

  // Close things up
  after(async function () {
    await server.close()
    console.log('c')
  })

  // ***********************************************
  // ************ BASIC NON-ELEMENT CALLS **********
  // ***********************************************

  describe(`Basic non-element calls`, async function () {
    it('checks the status', async function () {
      expect({a: 10}).to.be.an('object')
    })
  })

})
