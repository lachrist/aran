"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const State = require("./state.js");
const Object = require("./object.js");
const Parser = require("../../test/parser/index.js");
const Lang = require("./lang.js");

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  Assert.deepEqual(
    Object.obj(() => Lang.primitive(123)),
    Parser.parse(`(
      (typeof 123) === "object" ?
      123 :
      (
        123 === void 0 ?
        void 0 :
        #Object(123)))`));
  Assert.deepEqual(
    Object.get(Lang.primitive(123), Lang.primitive(456)),
    Parser.parse(`#Reflect.get(123, 456)`));
  Assert.deepEqual(
    Object.has(Lang.primitive(123), Lang.primitive(456)),
    Parser.parse(`#Reflect.has(123, 456)`));
  Assert.deepEqual(
    Object.del(false, Lang.primitive(123), Lang.primitive(456), null),
    Parser.parse(`#Reflect.deleteProperty(123, 456)`));
  Assert.deepEqual(
    Object.del(false, Lang.primitive(123), Lang.primitive(456), Lang.primitive(789)),
    Parser.parse(`(#Reflect.deleteProperty(123, 456), 789)`));
  Assert.deepEqual(
    Object.del(true, Lang.primitive(123), Lang.primitive(456), null),
    Parser.parse(`(
      #Reflect.deleteProperty(123, 456) ?
      true :
      throw new #TypeError(\"Cannot delete object property\"))`));
  Assert.deepEqual(
    Object.del(true, Lang.primitive(123), Lang.primitive(456), Lang.primitive(789)),
    Parser.parse(`(
      #Reflect.deleteProperty(123, 456) ?
      789 :
      throw new #TypeError(\"Cannot delete object property\"))`));
  Assert.deepEqual(
    Object.set(false, Lang.primitive(12), Lang.primitive(34), Lang.primitive(56), null),
    Parser.parse(`#Reflect.set(12, 34, 56)`));
  Assert.deepEqual(
    Object.set(false, Lang.primitive(12), Lang.primitive(34), Lang.primitive(56), Lang.primitive(78)),
    Parser.parse(`(#Reflect.set(12, 34, 56), 78)`));
  Assert.deepEqual(
    Object.set(true, Lang.primitive(12), Lang.primitive(34), Lang.primitive(56), null),
    Parser.parse(`(
      #Reflect.set(12, 34, 56) ?
      true :
      throw new #TypeError(\"Cannot assign object property\"))`));
  Assert.deepEqual(
    Object.set(true, Lang.primitive(12), Lang.primitive(34), Lang.primitive(56), Lang.primitive(78)),
    Parser.parse(`(
      #Reflect.set(12, 34, 56) ?
      78 :
      throw new #TypeError(\"Cannot assign object property\"))`));
});