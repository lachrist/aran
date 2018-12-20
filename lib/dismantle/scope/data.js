
const Error = global.Error;

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

exports.ExtendWith = (token, scope) => ({
  tag: "with",
  token: token,
  parent: scope
});

exports.ExtendCompletion = (token, scope) => ({
  tag: "completion",
  token: token,
  parent: scope
});

exports.ExtendSwitch = (token, scope) => ({
  tag: "switch",
  token: token,
  parent: scope
});

exports.ExtendBlock = (scope) => ({
  tag: "block",
  bindings: Object_create(null),
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

exports.GetLookup = (name, scope, closures) => {
  while (scope) {
    if (scope.tag === "block" && name in scope.bindings)
      return {tag:"hit", binding:scope.bindings[name], parent:scope.parent};
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
  return Reflect_ownKeys(scope.bindings);
};

////////////////////////
// Set (side-effect!) //
////////////////////////

exports.SetBinding = (key, value, scope) => {
  while (scope.tag !== "block")
    scope = scope.parent;
  if (key in scope.bindings)
    throw new Error("Duplicate declaration: "+key);
  scope.bindings[key] = value;
};
