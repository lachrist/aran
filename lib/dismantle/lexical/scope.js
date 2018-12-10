
const ArrayLite = require("array-lite");

const Object_create = Object.create;
const Object_keys = Object.keys;

exports.lookup = (name, closures, scope) => {
  const inner = true;
  const loop = (scope) => {
    if (scope.type === "root")
      return closures.global();
    if (scope.type === "closure")
      return (inner = false, loop(scope.parent));
    if (scope.type === "with")
      return closures.with(scope.object, loop(scope.parent));
    if (!(name in scope.bindings))
      return loop(scope.parent);
    if (scope.bindings[name].declared)
      return closures.local(true, scope.bindings[name].writable);
    if (inner)
      return closures.local(false, scope.bindings[name].writable);
    if (!scope.bindings[name].sticker) {
      let frame = scope;
      while (frame.type !== "root")
        frame = frame.parent;
      const token = ++frame.counter;
      scope.bindings[name].sticker = token;
      scope.tokens[scope.tokens.length] = token;
    }
    return closures.local(scope.bindings[name].sticker, scope.bindings[name].writable);
  };
  return loop(scope);
};

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
  return Build.BLOCK(
    ArrayLite.concat(tokens, names1, names2),
    ArrayLite.concat(
      ArrayLite.flatMap(
        ArrayLite.concat(names1, names2),
        (name) => (
          bindings[name].sticker ?
          Build.Expression(
            Build.write(
              bindings[name].sticker,
              Build.primitive(false),
              Build.primitive(void 0))) :
          []),
      statements);
};

exports.token = (expression, closure, scope) => {
  let frame = scope;
  while (frame.type !== "root")
    frame = frame.parent;
  const token = ++frame.counter;
  scope.tokens[scope.tokens.length] = token;
  return Build.write(token, expression, closure(token));
};

exports.Token = (expression, closure, scope) => {
  let frame = scope;
  while (frame.type !== "root")
    frame = frame.parent;
  const token = ++frame.counter;
  scope.tokens[scope.tokens.length] = token;
  return ArrayLite.concat(
    Build.Expression(
      Build.write(
        token,
        expression,
        Build.primitive(void 0))),
    closure(token));
};

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
