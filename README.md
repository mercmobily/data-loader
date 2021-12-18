# data-loader

[![npm version][npm-image]][npm-url]
[![install size][install-size-image]][install-size-url]

A data loader for SPA (Single Page Applications)
This module will aid Single Page Applications to load JSON data using REST automatically.

It is assumed that a routing library like routify will extrapolate IDs from the browser's location,
where `/user/:userId` (the page URL) will be resolved as `{ userId: 1 }` for URLs such as `/user/1`

The data URL for a page on the other hand will contain a list of stores and IDs, such 
as `/usersEndpoint/:userId` where `usersEndpoint` is the REST store nane, and `:userId` is the
ID that will be loaded. So, in this case the rest call will be made to the endpoint `/usersEndpoint/1`.

There might be more than one store defined in the data URL and the page URL. For example the page URL might be
`/users/:userId/addresses/:addressId` and the data URL might be `/usersEndpoint/:userId/addressesEndpoint/:addressId`

The end result is that by using this library, your page will automatically load all of the data it needs from
as many REST endpoints as necessary. As long as your naming conventions are sane, you will never have to worry
about loading data again.

## Setting up a testing environment



## Opinionated data loader

* Lading data is constant in SPA
* Opinion are important. Here is the list (cases straightforward to more complex)
* There is a data URL, and a page URL.
*   Page URL is the URL for the page. For example /users/:userId which, for /users/1, will resolve to { userId: 1 }
*   Data URL is the URL for the data to be loaded. For example /users/:userId means that the endpoint /users/1 will return a record which will be stored into userIdRecord
*   Page URL and data URL might differ). For example the page URL could be /userAddresses/:addressId (meaning, it will result into an object such as { addressId: 2 }, and the page URL might be /addresses/:addressId (meaning, it will result in a call to /addresses/2)
*   Page URL might have fewer paramers than the data URL (although it's uncommon). For example the page URL might be /addresses/:addressId (for example /addresses/2) and the data URL might be /users/:userId/addresses/:addressId which will be resolved as /users/(null)/addresses/2. In this case, the address record will need to return an object that includes the property `userId`, in order to allow the loading of the user record; otherwise, loading will fail 

## License

GPL


[npm-image]: https://flat.badgen.net/npm/v/spa-data-loader
[npm-url]: https://www.npmjs.com/package/spa-data-loader
[install-size-image]: https://flat.badgen.net/packagephobia/install/spa-data-loader
[install-size-url]: https://packagephobia.now.sh/result?p=spa-data-loader
