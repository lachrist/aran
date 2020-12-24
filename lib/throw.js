"use strict";

const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_apply = global.Reflect.apply;
const global_Object_prototype_toString = global.Object.prototype.toString;
const global_String = global.String;
const global_Error = global.Error;
const global_SyntaxError = global.SyntaxError;

const ArrayLite = require("array-lite");

exports.SyntaxError = global_SyntaxError;

ArrayLite.forEach(
  [
    "AsynchronousClosureAranError",
    "GeneratorClosureAranError",
    "EnclaveLimitationAranError",
    "InvalidOptionsAranError"],
  (name) => exports[name] = class extends global_Error {
    constructor (message) {
      super(message);
      this.name = name; } });

exports.inspect = (value) => (
  typeof value === "string" ?
  global_JSON_stringify(value) :
  (
    (
      typeof value === "function" ||
      (
        typeof value === "object" &&
        value !== null)) ?
    global_Reflect_apply(
      global_Object_prototype_toString,
      value,
      []) :
    global_String(value)));

exports.deadcode = () => { throw new global_Error(`Supposedly deadcode has been reached`) };

exports.abort = (constructor, message, optional) => { throw new (constructor === null ? global_Error : constructor)(message, optional) }

exports.assert = (check, constructor, message, optional) => check || exports.abort(constructor, message, optional);
