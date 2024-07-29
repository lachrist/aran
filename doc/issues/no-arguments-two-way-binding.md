In sloppy mode, functions with simple parameter list have their parameters
two-way bound with the `arguments` object. This means that changes to the
arguments object are reflected by the parameter values and vice versa. Aran does
not preserve this (crazy) behavior. If this becomes a real issue, it could be
possible to implement it with the `Proxy` API.

```js
function f(x) {
  console.log(1, { x, arg0: arguments[0] });
  arguments[0] = "bar";
  console.log(2, { x, arg0: arguments[0] });
  x = "qux";
  console.log(3, { x, arg0: arguments[0] });
}
f("foo");
```

Normal output:

```
1 { x: 'foo', arg0: 'foo' }
2 { x: 'bar', arg0: 'bar' }
3 { x: 'qux', arg0: 'qux' }
```

Aran output:

```
1 { x: 'foo', arg0: 'foo' }
2 { x: 'foo', arg0: 'bar' }
3 { x: 'qux', arg0: 'bar' }
```
