// {
//   let o = {
//     get x() {
//       return false;
//     },
//     set x(y) {
//       ARAN("FOOBAR");
//     },
//   };
//   o.x &&= 123;
// }

// console.log(Object.getOwnPropertyDescriptors(Symbol.prototype));

function f() {}
f.prototype = null;

class C {
  constructor() {
    // console.log(new.target);
    // console.log(this);
    console.log(Reflect.getPrototypeOf(this) === new.target.prototype);
    console.log(Reflect.getPrototypeOf(this) === C.prototype);
  }
}

Reflect.construct(C, [], f);

// console.log(Reflect.getPrototypeOf(b) === Object.prototype);
