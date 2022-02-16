# Welcome

Visit the [full web site](https://mobily-enterprises.github.io/data-loader) with the full source code as literate code and the comprehendive documentation.

Most (all?) SPAs need to load different data depending on the browser's location. Until now, each page had specific code to load the data it needed.

No more. Welcome to data-loader. An opinionated data loader that will allow you to focus on your app, rather than repetitive boilerplate code.

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