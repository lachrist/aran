// const iterator = {
//   [Symbol.iterator]: () => {
//     return {
//       next: () => {
//         console.log("next");
//         // throw new Error("NEXT");
//         return { done: false, value: 123 };
//       },
//       throw: () => {
//         console.log("throw");
//       },
//       return: () => {
//         console.log("return");
//         throw new Error("RETURN");
//       },
//     };
//   },
// };

// for (const [x] of iterator) {
//   console.log({ x });
//   throw new Error("BODY");
// }

for (const x of [1, 2, 3]) {
  console.log({ x });
}

const iterator = [1, 2, 3];
const iterable = iterator[Symbol.iterable]();
let step = iterable.next();
let caught = false;
while (!step.done) {
  try {
    const x = step.value;
    console.log({ x });
  } catch (error) {
    caught = true;
    try {
      iterable.return();
    } catch {}
    throw error;
  } finally {
    if (!caught && !next.done) {
      iterable.return();
    }
  }
  step = iterable.next();
}
