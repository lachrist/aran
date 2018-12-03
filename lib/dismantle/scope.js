
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

exports.lookup = (scope, name, closures) => loop(scope, name, closures, false);

exports.Root = () => ({
  type: "root",
  counter: 0
});

exports.With = (token, scope) => ({
  type: "with",
  parent: scope,
  object: token,
});

exports.Closure = (scope) => ({
  type: "closure",
  parent: scope
});

exports.Block = (names1, names2, scope) => {
  const bindings = Object_create(null);
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
  return {
    type: "block",
    parent: scope,
    bindings: bindings,
    tokens: [] };
};

exports.token = (scope) => {
  if (scope.type !== "block")
    throw new Error("Scope.token called on non block scope");
  let frame = scope;
  while (frame.type !== "root")
    frame = frame.parent;
  frame.counter++;
  scope.tokens[scope.tokens.length] = frame.counter;
  return frame.counter;
};

exports.identifiers = (scope) => {
  if (scope.type !== "block")
    throw new Error("Scope.token called on non block scope");
  return ArrayLite.concat(
    scope.tokens,
    Object_keys(scope.bindings));
};

exports.stickers = (scope) => {
  if (scope.type !== "block")
    throw new Error("Scope.stickers called on non block scope");
  return ArrayLite.flatMap(
    Object_keys(scope.bindings),
    (key) => scope.bindings.sticker ? [sticker] : []);
};

exports.declare = (name, scope) => {
  if (scope.type !== "block")
    throw new Error("Scope.declare called on non block scope");
  if (!(name in scope.bindings))
    throw new Error("Mismatch: "+name);
  if (scope.bindings[name].declared)
    throw new Error("Already declared: "+name);
  scope.bindings[name].declared = true;
  return scope.bindings[name].sticker;
};
