// let yo = null;

// const CC = class C extends ((yo = () => C), null) {};

// const CC = (() => {
//   let C;

// } ());

// console.log(yo());

// // const c = new CC();

// // console.log(Object.getOwnPropertyDescriptors(c));

// // // console.log(CC.foo.name);

// const x = new WeakMap();
// console.log(x.set({}, 123));

// import { runInThisContext } from "vm";
// runInThisContext(`
class c {
  static #foo = 123;
  static m(x) {
    console.log(#foo in x);
  }
}
c.m({});
// `);
