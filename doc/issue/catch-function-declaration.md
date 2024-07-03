In the case where a sloppy function declaration clashes with an error parameter,
the specification suggest to make two binding: one block-scoped and one
closure-scoped. This is completely crazy and I doubt it used in real-world code.
Since this is tedious to implement, I skipped this.

```js
(function () {
  console.log({ f }); // { f: undefined } | Reference error in Aran
  try {
    throw null;
  } catch (f) {
    console.log({ f }); // { f: null }
    {
      console.log({ f }); // { f: [Function: f] }
      function f() {
        return 123;
      }
      console.log({ f }); // { f: [Function: f] }
    }
    console.log({ f }); // { f: null }
  }
  console.log({ f }); // { f: undefined } | Reference error in Aran
})();
```
