
exports.with = (scope, token) => ({
  token: token,
  parent: scope});

exports.block = (identifiers1, identifiers2, scope) => ({
  deadzone: ArrayLite.concat(lets, consts),
  binding: ArrayLite.reduce(
    identifiers2,
    (binding, identifier) => (binding[identifier] = false, binding),
    ArrayLite.reduce(
      identifiers1, 
      (binding, identifier) => (binding[identifier] = true, binding),
      Object_create(null))),
  parent: scope});

exports.declare = (identifiers, scope) => ({
  deadzone: ArrayLite.filter(
    scope.deadzone,
    (identifier) => !ArrayLite.includes(identifier)),
  binding: scope.binding,
  parent: scope.parent});

exports.closure = (identifiers, scope) => ({
  deadzone: [],
  binding: ArrayLite.reduce(
    identifiers,
    (binding, identifier) => (binding[identifier] = true, binding),
    Object_create(null)),
  parent: scope});

exports.lookup = (scope, identifier, onwith, onhit, onglobal) => {
  const loop = (scope) => (
    scope ?
    (
      "token" in scope ?
      ARAN.cut.conditional(
        ARAN.cut.conditional(
          Builtin.has(
            ARAN.cut.read(frame),
            ARAN.cut.primitive(identifier)),
          ARAN.cut.conditional(
            ARAN.cut.hoist(
              number = ++ARAN.counter,
              Builtin.get(
                ARAN.cut.read(frame),
                ARAN.cut.builtin("Symbol.unscopables"))),
            Builtin.get(
              ARAN.cut.read(number),
              ARAN.cut.primitive(identifier)),
            ARAN.cut.primitive(false)),
          ARAN.cut.primitive(true)),
        loop(scope.parent),
        onwith(scope.token)),
      (
        identifier in scope.binding ?
        (
          ArrayLite.includes(scope.deadzone, identifier) ?
          ARAN.cut.apply(
            ARAN.cut.closure(
              ARAN.cut.Throw(
                ARAN.cut.construct(
                  ARAN.cut.builtin("ReferenceError"),
                  [
                    ARAN.cut.primitive(identifier+" is not defined")]))),
            ARAN.cut.primitive(void 0),
            []) :
          onhit(scope.binding[identifier])) :
        loop(scope.parent))) :
    onglobal());
  return loop(scope);
};
