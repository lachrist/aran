// let yo = null;

// const CC = class C extends ((yo = () => C), null) {};

// const CC = (() => {
//   let C;

// } ());

// console.log(yo());

// // const c = new CC();

// // console.log(Object.getOwnPropertyDescriptors(c));

// // // console.log(CC.foo.name);

console.log(
  {
    [{
      toString: () => {
        console.log("convert");
        return "foo";
      },
    }]: () => {},
  }.foo.name,
);
