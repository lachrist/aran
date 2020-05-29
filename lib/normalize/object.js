
const Lang = require("./lang.js");

// type CheckSuccess = Boolean

exports.obj = (make_aran_expression) => Lang.conditional(
  Lang.binary(
    "===",
    Lang.unary(
      "typeof",
      make_aran_expression()),
    Lang.primitive("object")),
  make_aran_expression(),
  Lang.conditional(
    Lang.binary(
      "===",
      make_aran_expression(),
      Lang.primitive(void 0)),
    Lang.primitive(void 0),
    Lang.apply(
      Lang.builtin("Object"),
      Lang.primitive(void 0),
      [
        make_aran_expression()])));

exports.get = (aran_expression_1, aran_expression_2) => Lang.apply(
  Lang.builtin("Reflect.get"),
  Lang.primitive(void 0),
  [aran_expression_1, aran_expression_2]);

exports.has = (aran_expression_1, aran_expression_2) => Lang.apply(
  Lang.builtin("Reflect.has"),
  Lang.primitive(void 0),
  [aran_expression_1, aran_expression_2]);

exports.del = (check_success, aran_expression_1, aran_expression_2, nullable_aran_expression, _aran_expression) => (
  _aran_expression = Lang.apply(
    Lang.builtin("Reflect.deleteProperty"),
    Lang.primitive(void 0),
    [aran_expression_1, aran_expression_2]),
  (
    check_success ?
    Lang.conditional(
      _aran_expression,
      (
        nullable_aran_expression === null ?
        Lang.primitive(true) :
        nullable_aran_expression),
      Lang.throw(
        Lang.construct(
          Lang.builtin("TypeError"),
          [
            Lang.primitive("Cannot delete object property")]))) :
    (
      nullable_aran_expression === null ?
      _aran_expression :
      Lang.sequence(_aran_expression, nullable_aran_expression))));

exports.set = (check_success, aran_expression_1, aran_expression_2, aran_expression_3, nullable_aran_expression, _aran_expression) => (
  _aran_expression = Lang.apply(
    Lang.builtin("Reflect.set"),
    Lang.primitive(void 0),
    [aran_expression_1, aran_expression_2, aran_expression_3]),
  (
    check_success ?
    Lang.conditional(
      _aran_expression,
      (
        nullable_aran_expression === null ?
        Lang.primitive(true) :
        nullable_aran_expression),
      Lang.throw(
        Lang.construct(
          Lang.builtin("TypeError"),
          [
            Lang.primitive("Cannot assign object property")]))) :
    (
      nullable_aran_expression === null ?
      _aran_expression :
      Lang.sequence(_aran_expression, nullable_aran_expression))));

