
const ArrayLite = require("array-lite");

const Error = global.Error;
const Number = global.Number;
const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
const Reflect_ownKeys = Reflect.ownKeys;

////////////
// Extend //
////////////

exports.ExtendStrict = (scope) => ({
  tag: "strict",
  parent: scope
});

exports.ExtendFunction = (scope) => ({
  tag: "closure",
  arrow: false,
  parent: scope
});

exports.ExtendArrow = (scope) => ({
  tag: "closure",
  arrow: true,
  parent: scope
});

exports.ExtendWith = (scope, token) => ({
  tag: "with",
  token: token,
  parent: scope
});

exports.ExtendCompletion = (scope, token) => ({
  tag: "completion",
  token: token,
  parent: scope
});

exports.ExtendSwitch = (scope, token) => ({
  tag: "switch",
  token: token,
  parent: scope
});

exports.ExtendBlock = (scope) => ({
  tag: "block",
  bindings: {},
  parent: scope
});

/////////
// Get //
/////////

exports.GetStrict = (scope) => {
  while (scope) {
    if (scope.tag === "strict")
      return true;
    scope = scope.parent
  }
  return false;
};

exports.GetCallee = (scope) => {
  while (scope) {
    if (scope.tag === "closure")
      return scope.arrow ? "arrow" : "function";
  }
  return null;
};

exports.GetSwitch = (scope) => {
  while (scope.tag !== "switch")
    scope = scope.parent;
  return scope.token;
};

exports.GetCompletion = (scope) => {
  while (scope.tag !== "completion")
    scope = scope.parent;
  return scope.completion;
};

exports.GetLookup = (scope, identifier, closures) => {
  while (scope) {
    if (scope.tag === "block" && Reflect_getOwnPropertyDescriptor(scope.bindings, identifier))
      return {tag:"hit", binding:scope.bindings[identifier]};
    if (scope.tag === "with")
      return {tag:"with", token:scope.token, parent:scope.parent};
    if (scope.tag === "closure")
      return {tag:"closure", parent:scope.parent};
    scope = scope.parent;
  }
  return {tag:"miss"};
};

exports.GetIdentifiers = (scope) => {
  while (scope.tag !== "block")
    scope = scope.parent;
  return ArrayLite.map(Reflect_ownKeys(scope.bindings), (identifier) => {
    return Number(identifier) || identifier;
  });
};

////////////////////////
// Set (side-effect!) //
////////////////////////

exports.SetBinding = (scope, identifier, binding) => {
  while (scope.tag !== "block")
    scope = scope.parent;
  if (Reflect_getOwnPropertyDescriptor(scope.bindings, identifier))
    throw new Error("Duplicate binding: "+identifier);
  scope.bindings[identifier] = binding;
};
