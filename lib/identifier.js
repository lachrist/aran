
const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

exports.Base = (identifier) => {
  if (identifier === "new.target") {
    return "$0newtarget";
  }
  return "$" + identifier;
};

exports.Parameter = (identifier) => {
  if (identifier === "callee" || identifier === "this" || identifier === "new.target" || identifier === "arguments" || identifier === "error") {
    return identifier;
  }
  throw new global_Error("parameter should be one of (callee|new.target|this|arguments|error)");
};

exports.Meta1 = (identifier) => {
  if (identifier === "new.target") {
    throw new global_Error("new.target should not be used to generate meta1 identifiers");
  }
  return "_" + identifier;
};

exports.Meta2 = (identifier) => {
  if (identifier === "new.target") {
    throw new global_Error("new.target should not be used to generate meta2 identifiers");
  }
  return "X" + identifier;
};

exports.Check = (identifier) => {
  if (!Syntax.identifier(identifier)) {
    return "not a valid JavaScript identifier";
  }
  if (identifier[0] === "$" || identifier[0] === "_" || identifier[0] === "X") {
    return "should not start with either '$', '_', or 'X' because it may clash with aran-generated identifier";
  }
  if (identifier === "callee" || identifier === "new.target" || identifier === "this" || identifier === "error") {
    return "should not be either of the following variables: 'callee', 'new.target', 'this', or 'error'"
  }
  return null;
};

exports.Show = (identifier) => {
  if (identifier[0] === "$") {
    if (identifier === "$0newtarget") {
      return "new.target";
    }
    return global_Reflect_apply(global_String_prototype_substring, identifier, [1]);
  }
  if (identifier[0] === "_") {
    return "%" + global_Reflect_apply(global_String_prototype_substring, identifier, [1]);
  }
  if (identifier[0] === "X") {
    return "#" + global_Reflect_apply(global_String_prototype_substring, identifier, [1]);
  }
  return "@" + identifier;
};
