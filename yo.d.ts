export type Foo1 = {
  foo: "a";
  bar: "b";
  qux: "c";
};
export type Foo2 = {
  foo: "aa";
  bar: "bb";
  qux: "cc";
};
export type Foo3 = {
  foo: "aa";
  bar: "BB";
  qux: "CC";
};
export type Foo = Foo1 | Foo2 | Foo3;

export type yo = <F extends Foo>(x: Omit<F, "qux">, y: F["qux"]) => void;

// export type Foo =
//   | {
//       foo: "a";
//       bar: "b";
//       qux: "c";
//     }
//   | {
//       foo: "aa";
//       bar: "bb";
//       qux: "cc";
//     }
//   | {
//       foo: "aa";
//       bar: "BB";
//       qux: "CC";
//     };
