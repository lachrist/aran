import { runInThisContext } from "vm";

// runInThisContext(`
// (function (f, g = () => f) {
//   var before, after;
//   eval("before = f; { function f() {} } after = f;");
//   console.log({ before, after, body: f, head: g() });
// })(123);
// `);

runInThisContext(`
  ((() => {
    var f = 123;
    let before, after;
    eval("before = f; { function f() {} } after = f");
    console.log({before, after});
  }) (123));
`);
