# ArrayLite

Tiny array utility which does not access the global object.
This module was developped to produce code resilient to modification of the global object.
It provides a significantly faster alternative to performing `Reflect.apply` on `Array.prototype`'s methods.
They are inspired from `Array.prototype`'s method of the same name:

* `concat`
* `every`
* `filter`
* `find`
* `findIndex`
* `flat`
* `flatMap`
* `forEach`
* `includes`
* `indexOf`
* `join`
* `lastIndexOf`
* `map`
* `reduce`
* `reduceRight`
* `reverse`
* `slice`
* `some`

Main differences are:
* The array is passed as the first argument rather than the `this` argument.
* It is not possible to specify the `this` argument passed to callback functions (e.g.: `forEach`, `map`, `filter`, etc).
* Arguments are often mandatory.
