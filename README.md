# data-loader

[![npm version][npm-image]][npm-url]
[![install size][install-size-image]][install-size-url]

A data loader for SPA (Single Page Applications)

This module allows Single Page Applications to load JSON data using REST automatically, based on the location data.
The idea is that any SPA should be able to load the data it needs based on the current location URL, and that the
process of translating the location URL to the actual fetching of data should be automated.

It is assumed that a routing library like routify will extrapolate IDs from the browser's location,
where `/view-user/:userId` (the page URL) will be resolved as `{ userId: 1 }` for URLs such as `/stores/users/1`

The data URL for a page on the other hand will contain a list of stores and IDs, such 
as `/stores/users/:userId` where `users` is the REST store name, and `:userId` is the
ID that will be loaded. So, in this case the rest call will be made to the endpoint `/stores/users/1`.

There might be more than one store defined in the data URL and the page URL. For example the page URL might be
`/view-users/:userId/view-addresses/:addressId` and the data URL might be `/stores/users/:userId/addresses/:addressId`

The end result is that by using this library, your page will automatically load all of the data it needs from
as many REST endpoints as necessary. As long as your naming conventions are sane, you will never have to worry
about loading data again: each page will know exactly how to load (or not load) its own data.

## Setting up a playground environment

Setting up a playground to test things out has the challenge that you need a number of existing parts in order
to fire up the loader. Specifically:

* A JSON REST server (with example _data_) that will respond with the right records
* A routing library that will "resolve" a given location given a template

Luckily, this is all done for you already. Under the directory "tests", you will find a file called `practice.js`
which includes everything you need.

### The JSON REST endpoints (stores)

In this playground, the same stores used for running tests are used. They are `Users.js`, `Addresses.js` and
`Tags.js`. Both `Addresses.js` and `Tags.js` include `userId` in their schema, which means that multiple
addresses and multiple tags are allowed for one user. Also, when loading an `address` record, an extra
property called `userIdRecord` is returned: it is the _full_ user record, the _same_ that would be returned
if a user were loaded directly. The URLs for those data stores are `/users/:userId`, `/addresses/:addressId` and
`/tags/:tagdId`. This means that fetching `http://localhost/stores/users/1` will return the user with ID 1.

The stores are prepped with dummy data: 4 users, where the first 2 users have 4 addresse and 4 tags attached. The
data contained is clear by looking at the `practice.js` file.

### The routing library

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
## Example use cases

The following use cases are created by adding code into the function `practiceCode()` in the `practice.js` file.
Make sure you have `routify` installed with `npm`, or the file won't work.

To run the practice file, just type `node practice.js` and see the result.

In the rest of this guide, several use cases will be shown -- really simple ones, to very uncommon and tricky ones.

### Normal load of a user (/view-user/1 loading data from /stores/users/1)

This is a very common and very simple case: the page's URL is `/view-user/1` while the page URL template
is `/view-user/:userId`.

This is the code for this test:

````
global.window = { location: { pathname: '/view-user/1' } }
let params = locationMatch('/view-user/:userId', () => true, true)

console.log(params)

const r = await loader(
  '/users/:userId', 
  params,
  false,
  {},
  defaultConfig
)
console.log(r)
````

The first step, `global.window = ...`, makes sure that the global variable `window.location` mimics
a browser viewing that page. The `locationMatch()` function of routify is run against the template
`/view-user/:userId`, which will resul in an object like so: `{ userId: 1 }`

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

That `:userId` is the key common ground between routify and the loader. The page can be called whatever and
not match the name of the store, as it is in this case (`/view-user`). However, the id parameters is `:userId`
both for the page (`/view-user/:userId`) and for the data URL (`/users/:userId`).

The full output will be as follows:

````
{ userId: '1', __PATH__: '/view-user/:userId' }

FETCHING: http://127.0.0.1:35763/stores/1.0.0/users/1

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

### Normal load of a user (/view-user/1 loading data from /stores/users/1), NO loading necessary

In some cases, the data doesn't need to be loaded since it's already available. A typical (and common) example
is one where the parent page will pass the record to the children pages.

This is achieved by having a property correctly named in the object passed as the fourth parameter of the loader:

````
global.window = { location: { pathname: '/view-user/1' } }
let params = locationMatch('/view-user/:userId', () => true, true)

console.log(params)

const r = await loader(
  '/users/:userId', 
  params,
  false,
  { userIdRecord: tony },
  defaultConfig
)
console.log(r)
````

The end result will be:

````
{ userId: '1', __PATH__: '/view-user/:userId' }
{
  loadedElementData: {},
  resolvedIdParamsValues: { users: '1' },
  resolvedListFilter: {},
  totalLoads: 0
}
````

There was no loading at all. The loader effectively skipped everything.



## License

GPL


[npm-image]: https://flat.badgen.net/npm/v/spa-data-loader
[npm-url]: https://www.npmjs.com/package/spa-data-loader
[install-size-image]: https://flat.badgen.net/packagephobia/install/spa-data-loader
[install-size-url]: https://packagephobia.now.sh/result?p=spa-data-loader
