# data-loader
=============

[![npm version][npm-image]][npm-url]
[![install size][install-size-image]][install-size-url]

A data loader for SPA (Single Page Applications)


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
