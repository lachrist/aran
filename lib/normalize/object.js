
const Build = require("./build.js");

// type CheckSuccess = Boolean

exports.obj = (make_aran_expression) => Build.conditional(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      make_aran_expression()),
    Build.primitive("object")),
  make_aran_expression(),
  Build.conditional(
    Build.binary(
      "===",
      make_aran_expression(),
      Build.primitive(void 0)),
    Build.primitive(void 0),
    Build.apply(
      Build.builtin("Object"),
      Build.primitive(void 0),
      [
        make_aran_expression()])));

exports.get = (aran_expression_1, aran_expression_2) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [aran_expression_1, aran_expression_2]);

exports.has = (aran_expression_1, aran_expression_2) => Build.apply(
  Build.builtin("Reflect.has"),
  Build.primitive(void 0),
  [aran_expression_1, aran_expression_2]);

exports.del = (check_success, aran_expression_1, aran_expression_2, nullable_aran_expression, _aran_expression) => (
  _aran_expression = Build.apply(
    Build.builtin("Reflect.deleteProperty"),
    Build.primitive(void 0),
    [aran_expression_1, aran_expression_2]),
  (
    check_success ?
    Build.conditional(
      _aran_expression,
      (
        nullable_aran_expression === null ?
        Build.primitive(true) :
        nullable_aran_expression),
      Build.throw(
        Build.construct(
          Build.builtin("TypeError"),
          [
            Build.primitive("Cannot delete object property")]))) :
    (
      nullable_aran_expression === null ?
      _aran_expression :
      Build.sequence(_aran_expression, nullable_aran_expression))));

exports.set = (check_success, aran_expression_1, aran_expression_2, aran_expression_3, nullable_aran_expression, _aran_expression) => (
  _aran_expression = Build.apply(
    Build.builtin("Reflect.set"),
    Build.primitive(void 0),
    [aran_expression_1, aran_expression_2, aran_expression_3]),
  (
    check_success ?
    Build.conditional(
      _aran_expression,
      (
        nullable_aran_expression === null ?
        Build.primitive(true) :
        nullable_aran_expression),
      Build.throw(
        Build.construct(
          Build.builtin("TypeError"),
          [
            Build.primitive("Cannot assign object property")]))) :
    (
      nullable_aran_expression === null ?
      _aran_expression :
      Build.sequence(_aran_expression, nullable_aran_expression))));

