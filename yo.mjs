// function* g(
//   ...{
//     [Symbol("foo")]: {
//       ["function.arguments"]: param_function_arguments,
//       ["this"]: param_this,
//       ["new.target"]: param_new_target,
//       ["variable1"]: variable1,
//     } = {
//       ["function.arguments"]: "FUNCTION_ARGUMENTS",
//       ["this"]: "THIS",
//       ["new.target"]: "NEW_TARGET",
//       ["variable1"]: "VARIABLE1",
//     },
//   }
// ) {
//   console.log({
//     param_function_arguments,
//     param_this,
//     param_new_target,
//     variable1,
//   });
// }

function* g() {
  return 123;
}

const gg = g();
console.log(gg.next());
console.log(gg.return());
