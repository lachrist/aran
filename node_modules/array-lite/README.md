# ArrayLite

Tiny array utility which does not access the global object.
This module was developped to produce code resilient to modification of the global object.
Instead of using this module, one can perform `Reflect.apply` on `Array.prototype`'s methods but it is [significanlty slower](https://jsperf.com/array-prototype-foreach-vs-user-made-foreach).

Functions inspired from `Array.prototype`'s method:
* `concat`
* `every`
* `filter`
* `find`
* `findIndex`
* `forEach`
* `includes`
* `indexOf`
* `join`
* `lastIndexOf`
* `map`
* `reduce`
* `reverse`
* `slice`
* `some`

Additional functions:
* `flaten`: `ArrayLite.flaten([xs1,xs2,xs2])` is equivalent to `ArrayLite.concat(xs1,xs2,xs3)`.
* `flatenMap`: `ArrayLite.flatenMap(xs, f)` is equivalent to `ArrayLite.flaten(ArrayLite.map(xs, f))`.
* `zipMap`: `ArrayLite.zipMap([x1,x2,x3],[f,f,f])` is equivalent to `ArrayLite.map([x1, x2, x3], f)`.
