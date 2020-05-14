"use strict";

const Assert = require("assert").strict;
const State = require("./state.js");
const Object = require("./object.js");
const Parser = require("../../test/parser/index.js");
const Build = require("./build.js");

require("../lang/build.js")._debug_mode();

State.session({nodes:[], serials:new Map(), evals:{__proto__:null}}, {
  sourceType: "script",
  type: "Program",
  body: []
}, () => {
  Assert.deepEqual(
    Object.obj(() => Build.primitive(123)),
    Parser.parse(`(
      (typeof 123) === "object" ?
      123 :
      (
        123 === void 0 ?
        void 0 :
        #Object(123)))`));
  Assert.deepEqual(
    Object.get(Build.primitive(123), Build.primitive(456)),
    Parser.parse(`#Reflect.get(123, 456)`));
  Assert.deepEqual(
    Object.has(Build.primitive(123), Build.primitive(456)),
    Parser.parse(`#Reflect.has(123, 456)`));
  Assert.deepEqual(
    Object.del(false, Build.primitive(123), Build.primitive(456), null),
    Parser.parse(`#Reflect.deleteProperty(123, 456)`));
  Assert.deepEqual(
    Object.del(false, Build.primitive(123), Build.primitive(456), Build.primitive(789)),
    Parser.parse(`(#Reflect.deleteProperty(123, 456), 789)`));
  Assert.deepEqual(
    Object.del(true, Build.primitive(123), Build.primitive(456), null),
    Parser.parse(`(
      #Reflect.deleteProperty(123, 456) ?
      true :
      throw new #TypeError(\"Cannot delete object property\"))`));
  Assert.deepEqual(
    Object.del(true, Build.primitive(123), Build.primitive(456), Build.primitive(789)),
    Parser.parse(`(
      #Reflect.deleteProperty(123, 456) ?
      789 :
      throw new #TypeError(\"Cannot delete object property\"))`));
  Assert.deepEqual(
    Object.set(false, Build.primitive(12), Build.primitive(34), Build.primitive(56), null),
    Parser.parse(`#Reflect.set(12, 34, 56)`));
  Assert.deepEqual(
    Object.set(false, Build.primitive(12), Build.primitive(34), Build.primitive(56), Build.primitive(78)),
    Parser.parse(`(#Reflect.set(12, 34, 56), 78)`));
  Assert.deepEqual(
    Object.set(true, Build.primitive(12), Build.primitive(34), Build.primitive(56), null),
    Parser.parse(`(
      #Reflect.set(12, 34, 56) ?
      true :
      throw new #TypeError(\"Cannot assign object property\"))`));
  Assert.deepEqual(
    Object.set(true, Build.primitive(12), Build.primitive(34), Build.primitive(56), Build.primitive(78)),
    Parser.parse(`(
      #Reflect.set(12, 34, 56) ?
      78 :
      throw new #TypeError(\"Cannot assign object property\"))`));
});