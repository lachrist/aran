When a constructor initialize `this`, if the prototype of `new.target` is not a
proper object, the `Object.prototype` intrinsic of the realm were `new.target`
was created should be used. Because there is currently no way to resolve the
realm of an arbitrary value, Aran uses the `Object.prototype` intrinsic of the
realm where the constructor was created instead.

```js
const local = globalThis;
const other = $262.createRealm().global;
const other_constructor = new other.Function();
other_constructor.prototype = null;
const default_prototype = local.Reflect.getPrototypeOf(
  local.Reflect.construct(function () {}, [], other_constructor),
);
console.log({
  is_default_prototype_local: default_prototype === local.Object.prototype,
  is_default_prototype_other: default_prototype === other.Object.prototype,
});
```

Normal output:

```
{
  is_default_prototype_local: false,
  is_default_prototype_other: true
}
```

Aran output:

```
{
  is_default_prototype_local: true,
  is_default_prototype_other: false
}
```
