
const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

exports.Base = (identifier) => {
  if (identifier === "new.target") {
    return "$0newtarget";
  }
  return "$" + identifier;
};

exports.Meta = (identifier) => {
  if (identifier === "new.target") {
    throw new global_Error("new.target should not be used to generate meta1 identifier");
  }
  return "_$" + identifier;
};

// exports.Meta2 = (identifier) => {
//   if (identifier === "new.target") {
//     throw new global_Error("new.target should not be used to generate meta2 identifier");
//   }
//   return "__" + identifier;
// };



// exports.Meta = (scope, identifier) => {
//   if (identifier === "new.target") {
//     throw new global_Error("new.target should not be used to generate meta identifier");
//   }
//   identifier = "_" + identifier;
//   if (scope) {
//     let index = 0;
//     while ((identifier + index) in argument) {
//       index++;
//     }
//     return identifier + index;
//   }
//   return identifier;
// };

exports.Show = (identifier) => {
  if (identifier[0] === "$") {
    if (identifier === "$0newtarget") {
      return "new.target";
    }
    return global_Reflect_apply(global_String_prototype_substring, identifier, [1]);
  }
  if (identifier[0] === "_") {
    return "#" + global_Reflect_apply(global_String_prototype_substring, identifier, [1]);
  }
  if (identifier === "callee" || identifier === "new.target" || identifier === "this" || identifier === "arguments") {
    return "@" + identifier;
  }
  throw new Error("Invalid identifier");
};
