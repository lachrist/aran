In sloppy mode, direct eval call can declare variables in the call site scope. A
feature often referred as dynamic declaration. If the surrounding scope is not
controlled by Aran, dynamic declarations will be kept at the scope of the eval
code instead. This happens if the global record is not reified or if the
instrumented code is meant to be executed into a direct eval call itself. The
reason why this is hard to solve is because Aran always produces strict code
which cannot dynamically declare variables.

```js
{
}
```
