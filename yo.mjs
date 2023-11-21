// let yo = null;

// const CC = class C extends ((yo = () => C), null) {};

// const CC = (() => {
//   let C;

// } ());

// console.log(yo());

// // const c = new CC();

// // console.log(Object.getOwnPropertyDescriptors(c));

// // // console.log(CC.foo.name);

function f() {
  console.log("foo", new.target);
  class C extends (console.log("qux", new.target), null) {
    static foo = console.log("bar", new.target);
  }
}

new f();
