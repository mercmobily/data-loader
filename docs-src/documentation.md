# data-loader

Visit the [full web site](https://mobily-enterprises.github.io/data-loader) with the full source code as literate code.

## Usage

The module exports a single function called `loader` with the following signature:

    export async function loader (dataUrl = '', routingData = {}, isList = false, elementData = {}, config = {})

The loader expects to be used in conjunction with a router that will provide `routingData` depending on the
browser's current location. 

Here is an explanation of each parameter:

* `dataUrl`

It's a string that represents the list of stores you want to load data from, and the respective IDs for each one
of those resources. For example `/users/:userId/addresses/:addressId` will mean that data will be loaded from
the stores `users` and `addresses`. Here `stores` simply means source of data. This string will provide two key
pieces of information to the data-loader: 1) The data store's name (e.g. `users` or `addresses` 2) The key to find the
IDs in the routing data (which comes from the application's router interpreting the location bar).

* `routingData`

The routing data comes from the application's router interpreting the location bar. For example if an element
is set to respond to `/view-users/:userId/view-addresses/:addressId`, and the browser's location is
`/view-users/10/view-addresses/20`, the routing data should be `{ userId: 10, addressId: 20 }`. It is paramount
that the name if the keys here (`userId` and `addressId`) match the keys specified in the `dataUrl` parameter. The matching
names is what glues the data URL and the routing data together.

* `isList`

If `isList` is set to true, the `dataUrl` parameter is expected to end with a store name, rather than a key, like this:
`/users/:userId/addresses/:addressId/notes`. In this case, `notes` will be assumed to be a store, and its records
will be loaded accordingly.

* `elementData`

The data loader will try its best to be as lazy as possible. The `elementData` property is an opportunity to provide data
already loaded to the store. For example, elementData could be `{ userId: { (...user object...) } }` which will allow
the data loader to skip the loading from the `users` store altogether.

* `config`

This is the configuration object that can be passed to every request. It can have the following properties set:

  * `storeUrlPrefix`. The prefix used to make GET calls to the store. Each store's endpoint is assumed to be
    the `storeUrlPrefix` property concatenated with the store's name. For example if `storeUrlPrefix` is `/stores`
    and the store is `users`, the endpoint used to load data will be assumed to be `/stores/users`.
  * `fetchUrlMofifier`. The assumed endpoint might not be correct. For this reason, a `fetchUrlModifier` function
    can be provided. The function will change the store's endpoint's URL in whichever way necessary
    to comply to the server. It receives several parameters, explained below.
  * `aggressiveLoading`. A flag that will enable aggressive loading (more requests, and less chance to minimise
    the number of requests)
  * `fetch`. The function used to fetch. Must have the exact same signature as `window.fetch()`
  * `verbose`. If true, it will print information to the console.


### Defining fetchUrlModifier

If the storeUrlPrefix is defined as `/stores`, and the store is `users`, the default endpoint for it will be:

* For lists,  `${storeUrlPrefix}/${dataUrlInfo.listStore}${searchParams}` (e.g. `/stores/users?param1=XXX&param2=YYY`)
* For single records, `${storeUrlPrefix}/${store}/${idParamValue}` (e.g. `/stores/users/XXX`)

In some cases, the server's endpoints might be radically different.
The signature of this function is:

 * `url` -- the URL as worked out the default way, explained above
 * `store` -- the name of the store.
 * `prefix` -- the store prefix
 * `isList` -- a flag to set whether it's a list or not
 * `searchParams` -- (only if isList is true) The search string, worked out as 
   `new URLSearchParams(resolvedListFilter).toString()` (with a leading `?` if not empty)
 * `resolvedListFilter` -- (only if isList is true) The variable used to make up the search string
 * `idParamValue` -- (only if isList is false) The ID of the item to fetch, worked out as `resolvedIdParamsValues[store]` 
 * `resolvedIdParamsValues` -- (only if isList is false) The IDs found in the record

A fetchUrlModifier function would generally speaking have a `switch` case checking `store`, and use the passed parameters
to either modify the `url` variable, or recreate it from scratch.

## A data loader for SPA (Single Page Applications)

Most (all?) SPAs need to load different data depending on the browser's location. Until now, each page had specific code to load the data it needed.

No more. Welcome to data-loader. An opinionated data loader that will allow you to focus on your app, rather than repetitive boilerplate code.

### Introduction

This module allows Single Page Applications to load JSON data using REST automatically, based on the location data.
The idea is that any SPA should be able to load the data it needs based on the current location URL, and that the
process of translating the location URL to the actual fetching of data should be automated.

It is assumed that a routing library like routify will extrapolate IDs from the browser's location,
where `/view-users/:userId` (the page URL) will be resolved as `{ userId: 1 }` for URLs such as `/stores/users/1`

The data URL for a page on the other hand will contain a list of stores and IDs, such 
as `/stores/users/:userId` where `users` is the REST store name, and `:userId` is the
ID that will be loaded. So, in this case the rest call will be made to the endpoint `/stores/users/1`.

There might be more than one store defined in the data URL and the page URL. For example the page URL might be
`/view-users/:userId/view-addresses/:addressId` and the data URL might be `/stores/users/:userId/addresses/:addressId`

The end result is that by using this library, your page will automatically load all of the data it needs from
as many REST endpoints as necessary. As long as your naming conventions are sane, you will never have to worry
about loading data again: each page will know exactly how to load (or not load) its own data.

### Setting up a playground environment

Setting up a playground to test things out has the challenge that you need a number of existing (complex) 
parts in order to replicate a real-world environment. Specifically:

* A JSON REST server (with example _data_) that will respond with the right records
* A routing library that will "resolve" a given location given a template

Luckily, this is all done for you already. Under the directory "tests", you will find a file called `practice.js`
which includes everything you need.

#### The JSON REST endpoints (stores)

In this playground, the same stores used for running tests are used. They are `Users.js`, `Addresses.js` and
`Tags.js`. Both `Addresses.js` and `Tags.js` include `userId` in their schema, which means that multiple
addresses and multiple tags are allowed for one user. Also, when loading an `address` record, an extra
property called `userIdRecord` is returned: it is the _full_ user record, the _same_ that would be returned
if a user were loaded directly. The URLs for those data stores are `/users/:userId`, `/addresses/:addressId` and
`/tags/:tagdId`. This means that fetching `http://localhost/stores/users/1` will return the user with ID 1.

The stores are prepped with dummy data: 4 users, where the first 2 users have 4 addresse and 4 tags attached. The
data contained is clear by looking at the `practice.js` file.

#### The routing library

Routing's main concern in a SPA is to display the correct page. In this case, however, the main concern is to
extrapolate the right IDs and then load the correct data depending on the URL.

For example when viewing `/view-users/1`, if the URL matches a pattern, then it will be "resolved". For example
if the page URL (pattern) is `/view-users/:userId`, then resolving `/view-users/1` will output an object
like this `{ userId: 1 }`.

This is exactly what `routify` does. In order for `practice.js` to work, routify must be installed:

````
npm install routify
````

Since routify is a javascript module, `practice.js` will load it with the call:

````
  const locationMatch = (await import('../node_modules/routify/routify.js')).locationMatch
````
### Example use cases

The following use cases are created by adding code into the function `practiceCode()` in the `practice.js` file.
Make sure you have `routify` installed with `npm`, or the file won't work.

To run the practice file, just type `node practice.js` and see the result.

In the rest of this guide, several use cases will be shown -- really simple ones, to very uncommon and tricky ones.

#### Normal load of a user (page /view-users/1 loading data from /stores/users/1)

This is a very common and very simple case: the page's URL is `/view-users/1` while the page URL template
is `/view-users/:userId`.

This is the code for this test:

````javascript
global.window = { location: { pathname: '/view-users/1' } }
let params = locationMatch('/view-users/:userId')

console.log('URL RESOLUTION:')
console.log(params)

const r = await loader(
  '/users/:userId', 
  params,
  false,
  {},
  defaultConfig
)

console.log('LOADER RESULT:')
console.log(r)
````

The first step, `global.window = ...`, makes sure that the global variable `window.location` mimics
a browser viewing that page. The `locationMatch()` function of routify is run against the template
`/view-users/:userId`, which will resul in an object like so: `{ userId: 1 }`

The loader is then called. 

The first parameter (`/users/:userId`) is the path of the store 

The second parameter (`{ userId: 1 }` is the `params` variable returned by routify, which includes the resolution done by routify.

The third parameter (`false`) indicates that this is not a request for a list -- more of that later.

The fourth parameter is the data object, which may include data already preloaded. This is used in case the
page already has the user object (possibly passed to it by a parent element), and therefore the loading would
be unnecessary. More of this later.

The last parameter is the default config, set earlier in the `practice.js` file.

Once the `loader()` function runs, it will output `FETCHING: http://127.0.0.1:35763/stores/1.0.0/users/1` (since
there is data to be fetched)

Note that the full URL (`http://127.0.0.1:35763/stores/1.0.0/users/1`) comes from the default prefix set in
`defaultConfig` (set as `http://127.0.0.1:${port}/stores/1.0.0`) followed by the store's URL in the second
parameter (`/users/:userId`) with the `:userId` portion resolved to `1`.

That `:userId` is the key common ground between routify and the loader. The page's url can be completely random
and not match the name of the store -- as it is in this casem with `/view-user/:userId` being the page URL and `/users/userId` being the data URL . However, the id parameters is (and must be) `:userId` both for both of them.

The full output will be as follows:

````

URL RESOLUTION:

{ userId: '1', __PATH__: '/view-users/:userId' }

FETCHING: http://127.0.0.1:35763/stores/1.0.0/users/1

LOADER RESULT:

{
  loadedElementData: { userIdRecord: { name: 'Chiara', surname: 'Fabbietti', id: 1 } },
  resolvedIdParamsValues: { users: '1' },
  resolvedListFilter: {},
  totalLoads: 1
}
````

The most important part is that `loadedElementData` which includes `userIdRecord`: the result of the fetch
call. The naming of the property, `userIdRecord`, is the result of the parameter name `userId` followed by
`Record`.

#### Normal load of a user (page /view-users/1 loading data from /stores/users/1), NO loading necessary

In some cases, the data doesn't need to be loaded since it's already available. A typical (and common) example
is one where the parent element will pass the record to the children elements -- in this case, you don't want
each element to make a request to the server.

This is achieved by having a property correctly named in the object (the ID, such as `userId`, followed by the word `Record`) passed as the fourth parameter of the loader:

````javascript
global.window = { location: { pathname: '/view-users/1' } }
let params = locationMatch('/view-users/:userId')

console.log('URL RESOLUTION:')
console.log(params)

const r = await loader(
  '/users/:userId', 
  params,
  false,
  { userIdRecord: tony },
  defaultConfig
)

console.log('LOADER RESULT:')
console.log(r)
````

The end result will be:

````

URL RESOLUTION:

{ userId: '1', __PATH__: '/view-users/:userId' }

LOADER RESULT:

{
  loadedElementData: {},
  resolvedIdParamsValues: { users: '1' },
  resolvedListFilter: {},
  totalLoads: 0
}
````

There was no loading at all. The loader effectively skipped everything: the data was considered already loaded. This is why `totalLoads` is 0, and `loadedElementData` is an empty object.

#### Normal load of a user and one of its tags (page /view-users/1/view-tags/2 loading data from /stores/users/1 and /stores/tags/4)

The data URL can contain multiple stores. In this case all the IDs in the data URL are the same as the ones in the page URL (`:userId` and `tagId`):

````javascript
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
````

The end result will be:

````
URL RESOLUTION:

{
  userId: '1',
  tagId: '4',
  __PATH__: '/view-users/:userId/view-tags/:tagId'
}

FETCHING: http://127.0.0.1:40443/stores/1.0.0/tags/4
FETCHING: http://127.0.0.1:40443/stores/1.0.0/users/1

LOADER RESULT:

{
  loadedElementData: {
    tagIdRecord: { id: 4, userId: 1, name: 'Chiara Tag 0' },
    userIdRecord: { name: 'Chiara', surname: 'Fabbietti', id: 1 }
  },
  resolvedIdParamsValues: { users: '1', tags: '4' },
  resolvedListFilter: {},
  totalLoads: 2
}

````

In this case, there were _two_ network fetches: one for the tag with ID 4, and one for the user with ID 1.

#### Load of a user and one of its addresses (page /view-users/1/view-addresses/2 loading data from /stores/users/1 and /stores/addresses/5) SKIPPING one fetch call

In this case, the loader will load the store `addresses` first by running the `fetch()` call. Since the fetched record _already_ had a property called `userIdRecord`, it will _not_ run another fetched call.
Note that the network call is skipped _without_ checking that the user ID in the address matches the user ID in the data URL. That is assumed to be the case.


````javascript
global.window = { location: { pathname: '/view-users/1/view-addresses/5' } }
let params = locationMatch('/view-users/:userId/view-addresses/:addressId')

console.log('URL RESOLUTION:')
console.log(params)

const r = await loader(
  '/users/:userId/addresses/:addressId', 
  params,
  false,
  { },
  defaultConfig
)

console.log('LOADER RESULT:')
console.log(r)
````

The result will be:

````
URL RESOLUTION:

{
  userId: '1',
  addressId: '5',
  __PATH__: '/view-users/:userId/view-addresses/:addressId'
}

FETCHING: http://127.0.0.1:35383/stores/1.0.0/addresses/5

LOADER RESULT:

{
  loadedElementData: {
    addressIdRecord: {
      id: 5,
      userId: 1,
      line1: 'Chiara Address 1',
      userIdRecord: [Object]
    },
    userIdRecord: { name: 'Chiara', surname: 'Fabbietti', id: 1 }
  },
  resolvedIdParamsValues: { users: '1', addresses: '5' },
  resolvedListFilter: {},
  totalLoads: 1
}
````

#### Load data with the page only having addressId (no userId), whereas the store URL includes `userId` and `addressId`; userId is fished out of the (fetched) `addressIdRecord` record which includes userIdRecord, only 1 call

This example shows that the data URL can have more IDs than the location URL. In this particular example the location URL only has the address ID. This is a typical use case where the page is `/view-addresses/5`, but the page itself also displays the user's name and other details (e.g. "Chiara's main address"). So, the data URL contains `:addressId` but _also_ `:userId`. Since the data loader has effectively no information on how to fetch the user, the user's information MUST come from the address record under the property `userIdRecord`: 


````javascript
  global.window = { location: { pathname: '/view-addresses/5' } }
    let params = locationMatch('/view-addresses/:addressId')
    
    console.log('URL RESOLUTION:')
    console.log(params)
    
    const r = await loader(
      '/users/:userId/addresses/:addressId', 
      params,
      false,
      { },
      defaultConfig
    )

    console.log('LOADER RESULT:')
    console.log(r)
````

The result is:

````
URL RESOLUTION:

{ addressId: '5', __PATH__: '/view-addresses/:addressId' }

FETCHING: http://127.0.0.1:35175/stores/1.0.0/addresses/5

LOADER RESULT:
{
  loadedElementData: {
    addressIdRecord: {
      id: 5,
      userId: 1,
      line1: 'Chiara Address 1',
      userIdRecord: [Object]
    },
    userIdRecord: { name: 'Chiara', surname: 'Fabbietti', id: 1 }
  },
  resolvedIdParamsValues: { users: 1, addresses: '5' },
  resolvedListFilter: {},
  totalLoads: 1
}
````

The page will display properties of the `userIdRecord` object, as well as the `addressIdRecord` object. This means that if you decide to change the architecture of the application (changing the page's location, or even not returning the user record in the address), the user record will be in the same place (`userIdRecord`) and no refactoring will be needed in the elements themselves.

#### Load data with the page only having tagId (no userId), whereas the store URL includes `userId` and `addressId`; userId is fished out of the (fetched) `addressIdRecord` record, and is used for the second `fetch()` call to populate `userIdRecord`


````javascript
    global.window = { location: { pathname: '/view-tags/5' } }
    let params = locationMatch('/view-tags/:tagId')
    
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
````

The result is:

````
URL RESOLUTION:

{ tagId: '5', __PATH__: '/view-tags/:tagId' }

FETCHING: http://127.0.0.1:43961/stores/1.0.0/tags/5
FETCHING: http://127.0.0.1:43961/stores/1.0.0/users/1

LOADER RESULT:

{
  loadedElementData: {
    tagIdRecord: { id: 5, userId: 1, name: 'Chiara Tag 1' },
    userIdRecord: { name: 'Chiara', surname: 'Fabbietti', id: 1 }
  },
  resolvedIdParamsValues: { users: 1, tags: '5' },
  resolvedListFilter: {},
  totalLoads: 2
}
````

#### Load a (filtered) list, enabling filters

The loader allows to specify, in its third parameter, if the data URL ends with a store name which will be loaded as a list. In this case, the page URL is `/view-users/:userId/all-tags`; the only part that really matters is `userId`; however, the data URL is  `/users/:userId/tags`. Since the third parameter is set to `true`, that `tags` at the end of the data URL is expected to be a store:

````javascript
    global.window = { location: { pathname: '/view-users/1/all-tags' } }
    let params = locationMatch('/view-users/:userId/all-tags')
    
    console.log('URL RESOLUTION:')
    console.log(params)
    
    const r = await loader(
      '/users/:userId/tags', 
      params,
      true,
      { userIdRecord: chiara },
      defaultConfig
    )

    console.log('LOADER RESULT:')
    console.log(r)
````

The result is:

````
URL RESOLUTION:

{ userId: '1', __PATH__: '/view-users/:userId/all-tags' }

FETCHING: http://127.0.0.1:33245/stores/1.0.0/users/1
FETCHING: http://127.0.0.1:33245/stores/1.0.0/tags?userId=1

LOADER RESULT:

{
  loadedElementData: {
    userIdRecord: { name: 'Chiara', surname: 'Fabbietti', id: 1 },
    tagsList: [ [Object], [Object], [Object], [Object] ]
  },
  resolvedIdParamsValues: { users: '1' },
  resolvedListFilter: { userId: '1' },
  totalLoads: 1
}
````

The list store is always the last one to be loaded. This is because the list store's query to the server is different: it doesn't include a specific ID, but id _does_ includes filtering in the query string; the filtering will include _all_ IDs present in the data URL. In this case, the data URL only had `userId` -- which is why the query for the list will be `/stores/1.0.0/tags?userId=1`. This ensures that only the tags belnging to that particular user will make their way into the resulting dataset. 

Note that the loadedElementData's property for the list is called `tagsList` (no `Record` suffix). There will only ever be one property with the `List` suffix, and it will only ever be there is the third parameter for the loader is set to `true`. If it _is_ set to true, then the last part of the data URL _must_ be a store name, which will be queried with the appropriate query string for filtering.

#### Load a (filtered) list, enabling filters, skipping one fetch

The same principles seen before in terms of pre-loading will apply here. This code for example already has `userIdRecord` in the element data parameter. So, the user will not be fetched:

````javascript
    global.window = { location: { pathname: '/view-users/1/all-tags' } }
    let params = locationMatch('/view-users/:userId/all-tags')
    
    console.log('URL RESOLUTION:')
    console.log(params)
    
    const r = await loader(
      '/users/:userId/tags', 
      params,
      true,
      { userIdRecord: chiara },
      defaultConfig
    )

    console.log('LOADER RESULT:')
    console.log(r)
````

The end result will only make one network call:

````
URL RESOLUTION:

{ userId: '1', __PATH__: '/view-users/:userId/all-tags' }

FETCHING: http://127.0.0.1:42473/stores/1.0.0/tags?userId=1

LOADER RESULT:

{
  loadedElementData: { tagsList: [ [Object], [Object], [Object], [Object] ] },
  resolvedIdParamsValues: { users: '1' },
  resolvedListFilter: { userId: '1' },
  totalLoads: 0
}
````

Note that only one fetch() call is done.

#### Not enough information

Sometimes, the loader will fail for lack of information. The loader goes to great length scanning the data in `elementData` and the data loaded: it will look for anything that looks like an ID, based on the parameters names. This was shown extensively in the examples above. However, sometimes there just isn't enough information.

For exampe this won't work:

````javascript
    global.window = { location: { pathname: '/view-users/1' } }
    let params = locationMatch('/view-users/:userId')
    
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
````

The problem here is that the page URL only provides `:userId`, whereas the loader also needs `tagId` which is nowhere to be seen.

### Closing notes

The main benefit of using this data loader is that you can code your element knowing that specific data will be there. This data can come from a direct network load, from a property of a record after a network load, from an outer element, or from a property of a record passed by the outer element.

The point is that where the data comes from _shouldn't matter_. You should be able to refactor your application to minimise network traffic, and _not_ change existing elements. You should be able to improve the server code, providing full objects for parent records, and know that the app will "magically" make fewer network calls.

This is precisely the goal of this data loader.


## License

GPL


[npm-image]: https://flat.badgen.net/npm/v/spa-data-loader
[npm-url]: https://www.npmjs.com/package/spa-data-loader
[install-size-image]: https://flat.badgen.net/packagephobia/install/spa-data-loader
[install-size-url]: https://packagephobia.now.sh/result?p=spa-data-loader
