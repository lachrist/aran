
const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

exports.Base = ($identifier) => {
  if ($identifier === "new.target") {
    return "$0newtarget";
  }
  return "$" + $identifier;
};

exports.Parameter = ($identifier) => {
  if ($identifier === "callee") {
    return "Callee";
  }
  if ($identifier === "this") {
    return "This";
  }
  if ($identifier === "new.target") {
    return "NewTarget";
  }
  if ($identifier === "arguments") {
    return "Arguments";
  }
  if ($identifier === "error") {
    return "Error";
  }
  throw new global_Error("parameter should either be one of: 'callee', 'new.target', 'this', 'arguments', or 'error' (this should never happen)");
};

exports.Meta = ($identifier) => {
  if ($identifier === "new.target") {
    throw new global_Error("new.target should not be used to generate meta identifiers");
  }
  return "_" + $identifier;
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
  if (identifier === "Callee") {
    return "@callee";
  }
  if (identifier === "NewTarget") {
    return "@new.target";
  }
  if (identifier === "This") {
    return "@this";
  }
  if (identifier === "Arguments") {
    return "@arguments";
  }
  if (identifier === "Error") {
    return "@error";
  }
  throw new global_Error("Unrecognized identifier (this should never happen)");
};
