// function rest () {
//   const array = arguments[0];
//   const iterator = arguments[1];
//   let step = null;
//   while (!(step = iterator.next()).done) {
//     array[array.length] = step.value;
//   }
//   return array;
// }

module.exports = () => {
  throw new Error("Rest not supported *yet*");
};