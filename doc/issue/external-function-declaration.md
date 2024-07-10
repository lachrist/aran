In sloppy mode, a function declaration inside a direct eval call introduces a
binding in the surrounding scope if it does not clash with other variables. Aran
skip this check and always introduces such binding. This check requires
knowledge of the surrounding scope during the hoisting phase which the current
architecture does not provide.

```js
(function (f, g = () => f) {
  var before, after;
  eval("before = f; { function f() {} } after = f;");
  console.log({ before, after, body: f, head: g() });
})(123);
```

Normal:

```
{ before: undefined, after: [Function: f], head: 123 }
```

Aran:

```
{ before: undefined, after: [Function: f] }
```

```js
(function (f) {
  var before, after;
  eval("before = f; { function f() {} } after = f;");
  // { before: 123, after: [Function: f] }
  console.log({ before, after });
})(123);
```

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
