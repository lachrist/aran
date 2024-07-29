`Function.prototype.toString` provides a string representation of the code the
given function. In Aran, the instrumented code will be returned rather than the
original code. Note that the exact format of this code the representation is not
part of the ECMAScript specification and is not guaranteed to be stable across
different JavaScript engines anyway. The only requirement is that if two
functions have the same source code then they should share source code
representation as well. Unfortunately, this is not always the case in Aran
because of compilation variables. So the below assertions is not guaranteed to
hold after Aran instrumentation.

```js
console.assert(function () {}.toString() === function () {}.toString());
```
