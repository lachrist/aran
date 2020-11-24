import * as yolo from "./yolo.mjs";
console.log(yolo);

//
// const { foo, bar: qux } = {foo:123, bar:456};
//
//
// traps.export = (key, location, value) => {
//   if (key === "*") {
//     location === source;
//     value = module;
//   }
// };
//
// // Export //
// export {foo as bar};                     // original
// hidden = trap.export("bar", traps.read("foo", foo)); // instrumented
// export {hidden as bar};                  // instrumented
// traps.export = (key, value) => {};
//
// // Export-Forward //
// import * as hidden from "source";
// traps.aggregate("source", hidden);
// export * from "source";
// traps.aggregate = (source, module) => {};
//
// // Static Import //
// import * as hidden from "source"
// foo = traps.import("source", hidden);
// traps.import = (source, module) => {};
//
// // Dynamic Import //
// import (1 + 2);
// traps.import(1 + 2, null);
//
// traps.module(null, import traps.source(1 + 2));
// traps.source = (source) => { };
// traps.module = (promise) => { };
//
//
//
//
// console.log("grunt");
// export default console.log("wesh");
// console.log("walla");
// export {foo as foo};
// export {qux as qux};
