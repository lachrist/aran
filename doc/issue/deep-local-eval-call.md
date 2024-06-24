In sloppy mode, direct eval calls can declare variables in the closest function
frame or else the global object. If this frame is not control by Aran, then
this variable will declared in the scope of the eval call instead. The technical
reason why this is the case is that Aran always instrument into strict code.

```js
// sloppy script;
eval("var x = 123");
console.log(globalThis.x);
```

```js

```