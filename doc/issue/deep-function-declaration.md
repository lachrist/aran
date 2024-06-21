In sloppy mode, function declarations are closure-scoped whereas they are
block-scoped in strict mode. The semantic of closure-scoped function declaration
is unclear.

```js
(() => {
  if (true) {
    console.log(f());
    function f() {
      return 123;
    }
  } else {
    console.log(f());
    function f() {
      return 456;
    }
  }
  console.log(f());
})();
```
