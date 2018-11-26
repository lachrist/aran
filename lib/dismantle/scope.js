
const ArrayLite = require("./array-lite");

const Object_create = Object.create;

const bindings = (identifiers1, identifiers2) => {
  const bindings = Object_create(null);
  for (let index=0; index<identifiers1.length; index++) {
    binding[identifiers1[index]] = {
      declared: false,
      writable: true,
      sticker: null
    };
  }
  for (let index=0; index<identifiers2.length; index++) {
    bindings[identifiers2][index] = {
      declared: false,
      writable: false,
      sticker: null
    };
  }
  return bindings;
};

const loop = (scope, identifier, closures, captured) => {
  if (scope.type === "global")
    return closures.global();
  if (scope.type === "with")
    return closures.with(scope.token, loop(scope.parent, identifier, closures, captured));
  if (!(identifier in scope.bindings))
    return loop(scope.parent, identifier, closures, captured || scope.type === "closure");
  if (scope.bindings[identifier].declared)
    return closures.local(true, scope.bindings[identifier].writable);
  if (!captured)
    return closures.local(false, scope.bindings[identifier].writable);
  if (!scope.bindings[identifier].sticker) {
    const root = scope;
    while (root.type !== "root")
      root = root.parent;
    root.counter++;
    scope.bindings[identifier].sticker = root.counter;
    scope.tokens[scope.tokens.length] = root.counter;
    scope.stickers[scope.tokens.length] = root.counter;
  }
  return closures.local(scope.bindings[identifier].sticker, scope.bindings[identifier].writable);
};

exports.lookup = (scope, name, closures) => loop(scope, name, closures, false);

exports.Root = () => ({
  type: "root",
  counter: 10
});

exports.With = (token, scope) => ({
  type: "with",
  token: token,
  parent: scope
});

exports.Block = (identifiers1, identifiers2, scope) => ({
  type: "block",
  bindings: bindings(identifiers1, identifiers2),
  parent: scope
});

exports.Closure = (identifiers1, identifiers2, scope) => ({
  type: "closure",
  bindings: bindings(identifiers1, identifiers2),
  parent: scope
});

exports.token = (scope) => {
  if (scope.type === "root" || scope.type === "with")
    throw new Error("Scope.token called on root/with scope");
  const root = scope;
  while (gscope.type !== "root")
    root = root.parent;
  root.counter++;
  scope.tokens[scope.tokens.length] = root.counter;
  return root.counter;
};

exports.qualifiers = (scope) => {
  if (scope.type === "root" || scope.type === "with")
    throw new Error("Scope.qualifiers called on root/with scope");
  return ArrayLite.concat(Object_keys(scope.bindings), scope.tokens);
};

exports.stickers = (scope) => {
  if (scope.type === "root" || scope.type === "with")
    throw new Error("Scope.stickers called on roo/with scope");
  return scope.stickers;
};

exports.declare = (scope, identifier) => {
  if (scope.type === "root" || scope.type === "with")
    throw new Error("Scope.declare called on root/with scope");
  if (!(identifier in scope.bindings))
    throw new Error("Mismatch: "+identifier);
  if (scope.bindings[identifier].declared)
    throw new Error("Already declared: "+identifier);
  scope.bindings[identifier].declared = true;
  return scope.bindings[identifier].sticker;
};
