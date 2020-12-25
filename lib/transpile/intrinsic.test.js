"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Lang = require("../lang");
const State = require("./state.js");
const Intrinsic = require("./intrinsic.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  //////////
  // Grab //
  //////////
  Lang._match(
    Intrinsic.grab("eval"),
    Lang.parse_expression("#eval"),
    Assert);
  Assert.throws(
    () => Intrinsic.grab("foo"),
    new Error("Cannot grab intrinsic"));
  // ArrayLite.forEach(
  //   [
  //     ["global", "global"],
  //     ["eval", "eval"],
  //     ["symbol_unscopables", "Symbol.unscopables"],
  //     ["symbol_iterator", "Symbol.iterator"],
  //     ["object_prototype", "Object.prototype"],
  //     ["function_prototype_arguments_getter", "Function.prototype.arguments.__get__"],
  //     ["function_prototype_arguments_setter", "Function.prototype.arguments.__set__"],
  //     ["array_prototype_values", "Array.prototype.values"]],
  //   ({0:key, 1:name}) => {
  //     Lang._match(
  //       Intrinsic[key](),
  //       Lang.parse_expression("#" + name),
  //       Assert)});
  ////////////////
  // Convertion //
  ////////////////
  // string //
  Lang._match(
    Intrinsic.string(
      Tree.primitive(123)),
    Lang.parse_expression(`#String(123)`),
    Assert);
  // fork_nullish //
  Lang._match(
    Intrinsic.fork_nullish(
      () => Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789)),
    Lang.parse_expression(`(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      456 :
      789)`),
    Assert);
  Lang._match(
    Intrinsic.fork_nullish(
      () => Tree.primitive(123),
      null,
      null),
    Lang.parse_expression(`(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      123 :
      #Object(123))`),
    Assert);
  // convert_to_object //
  Lang._match(
    Intrinsic.convert_to_object(
      Tree.primitive(123)),
    Lang.parse_expression(`#Object(123)`),
    Assert);
  // convert_to_array //
  Lang._match(
    Intrinsic.convert_to_array(
      Tree.primitive(123)),
    Lang.parse_expression(`#Array.from(123)`),
    Assert);
  //////////////////
  // Construction //
  //////////////////
  // construct_object //
  Lang._match(
    Intrinsic.construct_object(
      Tree.primitive(123),
      [
        [
          Tree.primitive("foo"),
          Tree.primitive("bar")]]),
    Lang.parse_expression(`{
      __proto__: 123,
      foo: "bar"}`),
    Assert);

  // Lang._match(
  //   Intrinsic.construct_object(
  //     Tree.primitive(123),
  //     [
  //       [
  //         Tree.primitive("foo"),
  //         {
  //           __proto__: null,
  //           value: Tree.primitive("value"),
  //           writable: true,
  //           enumerable: true,
  //           configurable: true}]]),
  //   Lang.parse_expression(`{
  //     __proto__: 123,
  //     foo: "value"}`),
  //   Assert);
  // Lang._match(
  //   Intrinsic.construct_object(
  //     Tree.primitive(123),
  //     [
  //       [
  //         Tree.primitive("foo"),
  //         {
  //           __proto__: null,
  //           value: Tree.primitive("value")}]]),
  //   Lang.parse_expression(`#Object.create(
  //     123,
  //     {
  //       __proto__: null,
  //       foo: {
  //         __proto__: null,
  //         value: "value"}})`),
  //   Assert);
  // construct_empty_array //
  Lang._match(
    Intrinsic.construct_empty_array(123),
    Lang.parse_expression(`#Array(123)`),
    Assert);
  // construct_array //
  Lang._match(
    Intrinsic.construct_array(
      [
        Tree.primitive(123),
        Tree.primitive(456)]),
    Lang.parse_expression(`#Array.of(123, 456)`),
    Assert);
  // construct_proxy //
  Lang._match(
    Intrinsic.construct_proxy(
      Tree.primitive(123),
      [
        [
          "foo",
          Tree.primitive(456)],
        [
          "bar",
          Tree.primitive(789)]]),
    Lang.parse_expression(`new #Proxy(123, {
      __proto__: null,
      foo: 456,
      bar: 789})`),
    Assert);
  // construct_regexp //
  Lang._match(
    Intrinsic.construct_regexp(123, 456),
    Lang.parse_expression(`new #RegExp(123, 456)`),
    Assert);
  // throw_type_error //
  Lang._match(
    Intrinsic.throw_type_error(123),
    Lang.parse_expression(`throw new #TypeError(123)`),
    Assert);
  // throw_reference_error //
  Lang._match(
    Intrinsic.throw_reference_error(123),
    Lang.parse_expression(`throw new #ReferenceError(123)`),
    Assert);
  // throw_syntax_error //
  Lang._match(
    Intrinsic.throw_syntax_error(123),
    Lang.parse_expression(`throw new #SyntaxError(123)`),
    Assert);
  ////////////////////////////////////////////
  // (Reflect && Object && Array) >> Reader //
  ////////////////////////////////////////////
  // apply //
  Lang._match(
    Intrinsic.apply(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789)),
    Lang.parse_expression(`#Reflect.apply(123, 456, 789)`),
    Assert);
  // construct //
  Lang._match(
    Intrinsic.construct(
      Tree.primitive(123),
      Tree.primitive(456),
      null),
    Lang.parse_expression(`#Reflect.construct(123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.construct(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789)),
    Lang.parse_expression(`#Reflect.construct(123, 456, 789)`),
    Assert);
  // get //
  Lang._match(
    Intrinsic.get(
      Tree.primitive(123),
      Tree.primitive(456),
      null),
    Lang.parse_expression(`#Reflect.get(123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.get(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789)),
    Lang.parse_expression(`#Reflect.get(123, 456, 789)`),
    Assert);
  // onw_keys //
  Lang._match(
    Intrinsic.own_keys(
      Tree.primitive(123)),
    Lang.parse_expression(`#Reflect.ownKeys(123)`),
    Assert);
  // get_prototype_of //
  Lang._match(
    Intrinsic.get_prototype_of(
      Tree.primitive(123)),
    Lang.parse_expression(`#Reflect.getPrototypeOf(123)`),
    Assert);
  // has //
  Lang._match(
    Intrinsic.has(
      Tree.primitive(123),
      Tree.primitive(456)),
    Lang.parse_expression(`#Reflect.has(123, 456)`),
    Assert);
  // get_own_property_descriptor //
  Lang._match(
    Intrinsic.get_own_property_descriptor(
      Tree.primitive(123),
      Tree.primitive(456)),
    Lang.parse_expression(`#Reflect.getOwnPropertyDescriptor(123, 456)`),
    Assert);
  // is_extensible //
  Lang._match(
    Intrinsic.is_extensible(Tree.primitive(123)),
    Lang.parse_expression(`#Reflect.isExtensible(123)`),
    Assert);
  // keys //
  Lang._match(
    Intrinsic.keys(Tree.primitive(123)),
    Lang.parse_expression(`#Object.keys(123)`),
    Assert);
  // slice //
  Lang._match(
    Intrinsic.slice(Tree.primitive(123), Tree.primitive(456), null),
    Lang.parse_expression(`#Array.prototype.slice(@123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.slice(Tree.primitive(123), Tree.primitive(456), Tree.primitive(789)),
    Lang.parse_expression(`#Array.prototype.slice(@123, 456, 789)`),
    Assert);
  // concat //
  Lang._match(
    Intrinsic.concat([Tree.primitive(123), Tree.primitive(456)]),
    Lang.parse_expression(`#Array.prototype.concat(@#Array.of(), 123, 456)`),
    Assert);
  // includes //
  Lang._match(
    Intrinsic.includes(Tree.primitive(123), Tree.primitive(456)),
    Lang.parse_expression(`#Array.prototype.includes(@123, 456)`),
    Assert);
  ////////////////////////////////////////////
  // (Reflect && Object && Array) >> Writer //
  ////////////////////////////////////////////
  // prevent_extensions && finalize_success //
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.primitive(123),
      false,
      Intrinsic._success_result),
    Lang.parse_expression(`#Reflect.preventExtensions(123)`),
    Assert);
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.primitive(123),
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Object.preventExtensions(123)`),
    Assert);
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.primitive(123),
      false,
      Tree.primitive(456)),
    Lang.parse_expression(`(#Reflect.preventExtensions(123), 456)`),
    Assert);
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.primitive(123),
      true,
      Intrinsic._success_result),
    Lang.parse_expression(`(
      #Reflect.preventExtensions(123) ?
      true :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  Assert.throws(
    () => Intrinsic.prevent_extensions(
      Tree.primitive(123),
      false,
      Intrinsic._target_result),
    new Error("Cannot return the target"));
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.primitive(123),
      true,
      Tree.primitive(456)),
    Lang.parse_expression(`(
      #Reflect.preventExtensions(123) ?
      456 :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  // delete_property //
  Lang._match(
    Intrinsic.delete_property(
      Tree.primitive(123),
      Tree.primitive(456),
      false,
      Intrinsic._success_result),
    Lang.parse_expression(`#Reflect.deleteProperty(123, 456)`),
    Assert);
  // set //
  Lang._match(
    Intrinsic.set(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789),
      null,
      false,
      Intrinsic._success_result),
    Lang.parse_expression(`#Reflect.set(123, 456, 789)`),
    Assert);
  Lang._match(
    Intrinsic.set(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789),
      Tree.primitive(0),
      false,
      Intrinsic._success_result),
    Lang.parse_expression(`#Reflect.set(123, 456, 789, 0)`),
      Assert);
  // set_prototype_of //
  Lang._match(
    Intrinsic.set_prototype_of(
      Tree.primitive(123),
      Tree.primitive(456),
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Object.setPrototypeOf(123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.set_prototype_of(
      Tree.primitive(123),
      Tree.primitive(456),
      false,
      Intrinsic._success_result),
    Lang.parse_expression(`#Reflect.setPrototypeOf(123, 456)`),
    Assert);
  // define_property //
  Assert.throws(
    () => Intrinsic.define_property(
      Tree.primitive("target"),
      Tree.primitive("key"),
      {
        __proto__: null,
        [global.Symbol("foo")]: Tree.primitive("bar")}),
    new global.Error("Invalid symbol property for descriptor"));
  Lang._match(
    Intrinsic.define_property(
      Tree.primitive("target"),
      Tree.primitive("key"),
      {
        __proto__: null,
        value: Tree.primitive("value"),
        writable: Tree.primitive("writable"),
        enumerable: Tree.primitive("enumerable"),
        configurable: Tree.primitive("configurable")},
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Object.defineProperty(
      "target",
      "key",
      {
        __proto__: null,
        value: "value",
        writable: "writable",
        enumerable: "enumerable",
        configurable: "configurable"})`),
    Assert);
  Lang._match(
    Intrinsic.define_property(
      Tree.primitive("target"),
      Tree.primitive("key"),
      {
        __proto__: null,
        value: Tree.primitive("value"),
        writable: true,
        enumerable: false},
      false,
      Intrinsic._success_result),
    Lang.parse_expression(`#Reflect.defineProperty(
      "target",
      "key",
      {
        __proto__: null,
        value: "value",
        writable: true,
        enumerable: false})`),
    Assert);
  // freeze && finalize_target //
  Lang._match(
    Intrinsic.freeze(
      Tree.primitive(123),
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Object.freeze(123)`),
    Assert);
  Lang._match(
    Intrinsic.freeze(
      Tree.primitive(123),
      true,
      Intrinsic._success_result),
    Lang.parse_expression(`(#Object.freeze(123), true)`),
    Assert);
  Lang._match(
    Intrinsic.freeze(
      Tree.primitive(123),
      true,
      Tree.primitive(456)),
    Lang.parse_expression(`(#Object.freeze(123), 456)`),
    Assert);
  Assert.throws(
    () => Intrinsic.freeze(
      Tree.primitive(123),
      false,
      Intrinsic._target_result),
    new Error("Must check the result"));
  // assign //
  Lang._match(
    Intrinsic.assign(
      Tree.primitive(123),
      [
        Tree.primitive(456),
        Tree.primitive(789)],
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Object.assign(123, 456, 789)`),
    Assert);
  // fill //
  Lang._match(
    Intrinsic.fill(
      Tree.primitive(123),
      Tree.primitive(456),
      null,
      null,
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Array.prototype.fill(@123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.fill(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789),
      null,
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Array.prototype.fill(@123, 456, 789)`),
    Assert);
  Lang._match(
    Intrinsic.fill(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789),
      Tree.primitive(0),
      true,
      Intrinsic._target_result),
    Lang.parse_expression(`#Array.prototype.fill(@123, 456, 789, 0)`),
    Assert);
  Assert.throws(
    () => Intrinsic.fill(
      Tree.primitive(123),
      Tree.primitive(456),
      null,
      Tree.primitive(789),
      true,
      Intrinsic._target_result),
    new Error("Array.prototype.fill: start cannot be null while end is not null"));
  // push //
  Lang._match(
    Intrinsic.push(
      Tree.primitive(123),
      Tree.primitive(456),
      true,
      Intrinsic._success_result),
    Lang.parse_expression(`(#Array.prototype.push(@123, 456), true)`),
    Assert);
  Assert.throws(
    () => Intrinsic.push(
      Tree.primitive(123),
      Tree.primitive(456),
      true,
      Intrinsic._target_result),
    new Error("push cannot return the target"));
}, []);
