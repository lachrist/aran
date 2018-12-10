
const ArrayLite = require("array-lite");

const Object_create = Object.create;
const Object_keys = Object.keys;

const loop = (scope, name, closures, captured) => {
  if (scope.type === "root")
    return closures.global();
  if (scope.type === "closure")
    return loop(scope.parent, name, closures, true);
  if (scope.type === "with")
    return closures.with(scope.object, loop(scope.parent, name, closures, captured));
  if (!(name in scope.bindings))
    return loop(scope.parent, name, closures, captured);
  if (scope.bindings[name].declared)
    return closures.local(true, scope.bindings[name].writable);
  if (!captured)
    return closures.local(false, scope.bindings[name].writable);
  if (!scope.bindings[name].sticker) {
    let frame = scope;
    while (frame.type !== "root")
      frame = frame.parent;
    frame.counter++;
    scope.bindings[name].sticker = frame.counter;
    scope.tokens[scope.tokens.length] = frame.counter;
  }
  return closures.local(scope.bindings[name].sticker, scope.bindings[name].writable);
};

exports.lookup = (name, closures, scope) => loop(scope, name, closures, false);

exports.EXTEND = (tag, names1, names2, closure, scope) => {
  scope = scope || ({type:"root", counter:0});
  const bindings = Object_create(null);
  const tokens = [];
  for (let index=0; index<names1.length; index++) {
    if (names1[index] in bindings)
      throw new SyntaxError("Identifier "+names1[index]+" has already been declared");
    bindings[names1[index]] = {
      declared: false,
      writable: true,
      sticker: null
    };
  }
  for (let index=0; index<names2.length; index++) {
    if (names2[index] in bindings)
      throw new SyntaxError("Identifier "+names2[index]+" has already been declared");
    bindings[names2[index]] = {
      declared: false,
      writable: false,
      sticker: null
    };
  }
  const statements = closure({
    tag: tag,
    parent: (
      typeof tag === "number" ?
      {type:"with", object:tag, parent:scope} :
      tag ? {type:"closure", parent:scope} : scope),
    bindings: bindings,
    tokens: tokens
  });
  return [
    ArrayLite.concat(tokens, names1, names2),
    ArrayLite.concat(
      ArrayLite.flatMap(
        ArrayLite.concat(names1, names2),
        (name) => (
          bindings[name].sticker ?
          Build.Write(
            bindings[name].sticker,
            Build.primitive(false)) :
          []),
      statements];
};

// exports.local = (identifier, scope) => {
//   while (scope.type !== "closure") {
//     if (identifier in scope.bindings) {
//       return true;
//     }
//   };
//   return false;
// };

exports.token = (expression, closure, scope) => {
  let frame = scope;
  while (frame.type !== "root")
    frame = frame.parent;
  frame.counter++;
  scope.tokens[scope.tokens.length] = frame.counter;
  return Build.write(
    frame.counter,
    expression,
    closure(frame.counter));
};

exports.Token = (expression, closure, scope) => {
  let frame = scope;
  while (frame.type !== "root")
    frame = frame.parent;
  frame.counter++;
  scope.tokens[scope.tokens.length] = frame.counter;
  return ArrayLite.concat(
    Build.Write(
      frame


// exports.identifiers = (scope) => {
//   if (scope.type !== "block")
//     throw new Error("Scope.token called on non block scope");
//   return ArrayLite.concat(
//     scope.tokens,
//     Object_keys(scope.bindings));
// };

// exports.stickers = (scope) => {
//   if (scope.type !== "block")
//     throw new Error("Scope.stickers called on non block scope");
//   return ArrayLite.flatMap(
//     Object_keys(scope.bindings),
//     (key) => scope.bindings.sticker ? [sticker] : []);
// };

exports.declare = (name, expression1, expression2, scope) => {
  if (!(name in scope.bindings))
    throw new Error("Mismatch: "+name);
  if (scope.bindings[name].declared)
    throw new Error("Already declared: "+name);
  scope.bindings[name].declared = true;
  return (
    scope.bindings[name].sticker ?
    Build.write(
      scope.bindings[name].sticker,
      Build.primitive(true)
      Build.write(
        name,
        expression1,
        expression2)) :
    Build.write(
      name,
      expression1,
      expression2));
};
