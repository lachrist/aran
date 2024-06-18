Excluded properties are accessed twice.

```js
const _ARAN_LOG_ = console.log;

const { foo, ...rest } = new Proxy(
  { foo: 123, bar: 456, qux: 789 },
  {
    get: (target, key, receiver) => {
      _ARAN_LOG_(`get >> ${key}`);
      return Reflect.get(target, key, receiver);
    },
    getOwnPropertyDescriptor: (target, key) => {
      _ARAN_LOG_(`getOwnPropertyDescriptor >> ${key}`);
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    ownKeys: (target) => {
      console.log("ownKeys");
      return Reflect.ownKeys(target);
    },
  },
);

_ARAN_LOG_({ foo, rest });
```

```
get >> foo
ownKeys
getOwnPropertyDescriptor >> bar
get >> bar
getOwnPropertyDescriptor >> qux
get >> qux
{ foo: 123, rest: { bar: 456, qux: 789 } }
```

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
