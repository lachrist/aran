"use strict";

const Tree = require("./tree.js");

// type CheckSuccess = Boolean

exports.obj = (make_aran_expression) => Tree.conditional(
  Tree.binary(
    "===",
    Tree.unary(
      "typeof",
      make_aran_expression()),
    Tree.primitive("object")),
  make_aran_expression(),
  Tree.conditional(
    Tree.binary(
      "===",
      make_aran_expression(),
      Tree.primitive(void 0)),
    Tree.primitive(void 0),
    Tree.apply(
      Tree.builtin("Object"),
      Tree.primitive(void 0),
      [
        make_aran_expression()])));

exports.get = (aran_expression_1, aran_expression_2) => Tree.apply(
  Tree.builtin("Reflect.get"),
  Tree.primitive(void 0),
  [aran_expression_1, aran_expression_2]);

exports.has = (aran_expression_1, aran_expression_2) => Tree.apply(
  Tree.builtin("Reflect.has"),
  Tree.primitive(void 0),
  [aran_expression_1, aran_expression_2]);

exports.del = (check_success, aran_expression_1, aran_expression_2, nullable_aran_expression, _aran_expression) => (
  _aran_expression = Tree.apply(
    Tree.builtin("Reflect.deleteProperty"),
    Tree.primitive(void 0),
    [aran_expression_1, aran_expression_2]),
  (
    check_success ?
    Tree.conditional(
      _aran_expression,
      (
        nullable_aran_expression === null ?
        Tree.primitive(true) :
        nullable_aran_expression),
      Tree.throw(
        Tree.construct(
          Tree.builtin("TypeError"),
          [
            Tree.primitive("Cannot delete object property")]))) :
    (
      nullable_aran_expression === null ?
      _aran_expression :
      Tree.sequence(_aran_expression, nullable_aran_expression))));

exports.set = (check_success, aran_expression_1, aran_expression_2, aran_expression_3, nullable_aran_expression, _aran_expression) => (
  _aran_expression = Tree.apply(
    Tree.builtin("Reflect.set"),
    Tree.primitive(void 0),
    [aran_expression_1, aran_expression_2, aran_expression_3]),
  (
    check_success ?
    Tree.conditional(
      _aran_expression,
      (
        nullable_aran_expression === null ?
        Tree.primitive(true) :
        nullable_aran_expression),
      Tree.throw(
        Tree.construct(
          Tree.builtin("TypeError"),
          [
            Tree.primitive("Cannot assign object property")]))) :
    (
      nullable_aran_expression === null ?
      _aran_expression :
      Tree.sequence(_aran_expression, nullable_aran_expression))));

