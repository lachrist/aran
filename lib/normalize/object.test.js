"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const State = require("./state.js");
const Object = require("./object.js");
const Lang = require("../lang/index.js");
const Tree = require("./tree.js");

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  Assert.deepEqual(
    Object.obj(() => Tree.primitive(123)),
    Lang.parse_expression(`(
      (typeof 123 === "object") ?
      123 :
      (
        (123 === void 0) ?
        void 0 :
        #Object(123)))`));
  Assert.deepEqual(
    Object.get(Tree.primitive(123), Tree.primitive(456)),
    Lang.parse_expression(`#Reflect.get(123, 456)`));
  Assert.deepEqual(
    Object.has(Tree.primitive(123), Tree.primitive(456)),
    Lang.parse_expression(`#Reflect.has(123, 456)`));
  Assert.deepEqual(
    Object.del(false, Tree.primitive(123), Tree.primitive(456), null),
    Lang.parse_expression(`#Reflect.deleteProperty(123, 456)`));
  Assert.deepEqual(
    Object.del(false, Tree.primitive(123), Tree.primitive(456), Tree.primitive(789)),
    Lang.parse_expression(`(#Reflect.deleteProperty(123, 456), 789)`));
  Assert.deepEqual(
    Object.del(true, Tree.primitive(123), Tree.primitive(456), null),
    Lang.parse_expression(`(
      #Reflect.deleteProperty(123, 456) ?
      true :
      throw new #TypeError(\"Cannot delete object property\"))`));
  Assert.deepEqual(
    Object.del(true, Tree.primitive(123), Tree.primitive(456), Tree.primitive(789)),
    Lang.parse_expression(`(
      #Reflect.deleteProperty(123, 456) ?
      789 :
      throw new #TypeError(\"Cannot delete object property\"))`));
  Assert.deepEqual(
    Object.set(false, Tree.primitive(12), Tree.primitive(34), Tree.primitive(56), null),
    Lang.parse_expression(`#Reflect.set(12, 34, 56)`));
  Assert.deepEqual(
    Object.set(false, Tree.primitive(12), Tree.primitive(34), Tree.primitive(56), Tree.primitive(78)),
    Lang.parse_expression(`(#Reflect.set(12, 34, 56), 78)`));
  Assert.deepEqual(
    Object.set(true, Tree.primitive(12), Tree.primitive(34), Tree.primitive(56), null),
    Lang.parse_expression(`(
      #Reflect.set(12, 34, 56) ?
      true :
      throw new #TypeError(\"Cannot assign object property\"))`));
  Assert.deepEqual(
    Object.set(true, Tree.primitive(12), Tree.primitive(34), Tree.primitive(56), Tree.primitive(78)),
    Lang.parse_expression(`(
      #Reflect.set(12, 34, 56) ?
      78 :
      throw new #TypeError(\"Cannot assign object property\"))`));
});