In object pattern with rest element, each property is accessed exactly by
listing the object own keys. Instead, Aran does not list the object own keys and
accessed the matched one twice. This is not a hard technical challenge to
overcome but it will require to list

```js
const { foo, ...rest } = new Proxy(
  { foo: 123, bar: 456, qux: 789 },
  {
    get: (target, key, receiver) => {
      console.log(`get >> ${key}`);
      return Reflect.get(target, key, receiver);
    },
    getOwnPropertyDescriptor: (target, key) => {
      console.log(`getOwnPropertyDescriptor >> ${key}`);
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    ownKeys: (target) => {
      console.log("ownKeys");
      return Reflect.ownKeys(target);
    },
  },
);
console.log({ foo, rest });
```

Normal:

```
get >> foo
ownKeys
getOwnPropertyDescriptor >> bar
get >> bar
getOwnPropertyDescriptor >> qux
get >> qux
{ foo: 123, rest: { bar: 456, qux: 789 } }
```

Aran:

```
'get >> foo'
'getOwnPropertyDescriptor >> foo'
'get >> foo'
'getOwnPropertyDescriptor >> bar'
'get >> bar'
'getOwnPropertyDescriptor >> qux'
'get >> qux'
{ foo: 123, rest: { bar: 456, qux: 789 } }
```
