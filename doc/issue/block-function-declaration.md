_EDIT_ Sloppy direct eval call with escaping function declaration: always
considered closure-scoped.

In sloppy mode, function declarations in blocks have a convoluted semantic:
sometimes they are closure-scoped and sometimes they are block-scoped. Whereas,
in strict mode, function declaration are always block-scoped. In fact, sloppy
function declaration in blocks are not really part of the ECMAScript
specification. It was added in Appendix B for compatibility purpose. Making Aran
conform to this semantic is tedious. Currently, Aran provide a simpler semantic:
sloppy function declaration are always closure-scoped but their initialization
is hoisted at the beginning of the block.

Sloppy block-scoped function declaration:

```js
console.log(
  ((f) => {
    const record = {};
    record.before_outer = f;
    {
      record.before_inner = f;
      function f() {}
      record.after_inner = f;
    }
    record.after_outer = f;
    return record;
  })(123),
);
```

Normal:

```
{
  outer_before: 123,
  inner_before: [Function: f],
  inner_after: [Function: f],
  outer_after: 123
}
```

Aran:

```
{
  outer_before: undefined,
  inner_before: [Function: f],
  inner_after: [Function: f],
  outer_after: [Function: f]
}
```

Closure block-scoped function declaration:

```js
console.log(
  (() => {
    const record = {};
    record.outer_before = f;
    {
      record.inner_before = f;
      function f() {}
      record.inner_after = f;
    }
    record.outer_after = f;
    return record;
  })(),
);
```

Normal and Aran:

```
{
  outer_before: undefined,
  inner_before: [Function: f],
  inner_after: [Function: f],
  outer_after: [Function: f]
}
```
