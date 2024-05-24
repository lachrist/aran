// const delegate = (value) => ({
//   [Symbol.iterator]: () => {
//     console.log("create");
//     let done = false;
//     return {
//       next: (result) => {
//         console.log("next", result);
//         if (done) {
//           return { done: true, value: result };
//         } else {
//           done = true;
//           return { done: false, value };
//         }
//       },
//       throw: (error) => {
//         console.log("thow", error);
//         throw error;
//       },
//       return: (result) => {
//         console.log("return", result);
//         return {
//           done: true,
//           value: result,
//         };
//       },
//     };
//   },
// });

// function* g() {
//   try {
//     // yield "foo";
//     console.log("before yield1");
//     console.log("after yield1", yield* delegate("foo"));
//     console.log("before yield 2");
//     console.log("after yield2", yield* delegate("bar"));
//   } finally {
//     console.log("finally");
//   }
// }

// const it = g();

// console.log("next1", it.next(123));

// // console.log("next2", it.next(456));

// console.log("before return");
// console.log("after return", it.return(789));

// // console.log("next3", it.next(789));

// // console.log("return", it.return(789));

async function f() {
  throw new Error("foo");
}

f();
console.log("wesh");
