"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js").toggleDebugMode();

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
    Lang.parseExpression("#eval"),
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
  //       Lang.parseExpression("#" + name),
  //       Assert)});
  ////////////////
  // Convertion //
  ////////////////
  // string //
  Lang._match(
    Intrinsic.string(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#String(123)`),
    Assert);
  // fork_nullish //
  Lang._match(
    Intrinsic.fork_nullish(
      () => Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      456 :
      789)`),
    Assert);
  Lang._match(
    Intrinsic.fork_nullish(
      () => Tree.PrimitiveExpression(123),
      null,
      null),
    Lang.parseExpression(`(
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
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Object(123)`),
    Assert);
  // convert_to_array //
  Lang._match(
    Intrinsic.convert_to_array(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Array.from(123)`),
    Assert);
  //////////////////
  // Construction //
  //////////////////
  // construct_symbol //
  Lang._match(
    Intrinsic.construct_symbol("foo"),
    Lang.parseExpression(`#Symbol("foo")`),
    Assert);
  // construct_object //
  Lang._match(
    Intrinsic.construct_object(
      Tree.PrimitiveExpression(123),
      [
        [
          Tree.PrimitiveExpression("foo"),
          Tree.PrimitiveExpression("bar")]]),
    Lang.parseExpression(`{
      __proto__: 123,
      foo: "bar"}`),
    Assert);

  // Lang._match(
  //   Intrinsic.construct_object(
  //     Tree.PrimitiveExpression(123),
  //     [
  //       [
  //         Tree.PrimitiveExpression("foo"),
  //         {
  //           __proto__: null,
  //           value: Tree.PrimitiveExpression("value"),
  //           writable: true,
  //           enumerable: true,
  //           configurable: true}]]),
  //   Lang.parseExpression(`{
  //     __proto__: 123,
  //     foo: "value"}`),
  //   Assert);
  // Lang._match(
  //   Intrinsic.construct_object(
  //     Tree.PrimitiveExpression(123),
  //     [
  //       [
  //         Tree.PrimitiveExpression("foo"),
  //         {
  //           __proto__: null,
  //           value: Tree.PrimitiveExpression("value")}]]),
  //   Lang.parseExpression(`#Object.create(
  //     123,
  //     {
  //       __proto__: null,
  //       foo: {
  //         __proto__: null,
  //         value: "value"}})`),
  //   Assert);
  // construct_array //
  Lang._match(
    Intrinsic.construct_array(
      [
        Tree.PrimitiveExpression(123),
        Tree.PrimitiveExpression(456)]),
    Lang.parseExpression(`#Array.of(123, 456)`),
    Assert);
  // construct_proxy //
  Lang._match(
    Intrinsic.construct_proxy(
      Tree.PrimitiveExpression(123),
      [
        [
          "foo",
          Tree.PrimitiveExpression(456)],
        [
          "bar",
          Tree.PrimitiveExpression(789)]]),
    Lang.parseExpression(`new #Proxy(123, {
      __proto__: null,
      foo: 456,
      bar: 789})`),
    Assert);
  // construct_regexp //
  Lang._match(
    Intrinsic.construct_regexp(123, 456),
    Lang.parseExpression(`new #RegExp(123, 456)`),
    Assert);
  // throw_type_error //
  Lang._match(
    Intrinsic.throw_type_error(123),
    Lang.parseExpression(`throw new #TypeError(123)`),
    Assert);
  // throw_reference_error //
  Lang._match(
    Intrinsic.throw_reference_error(123),
    Lang.parseExpression(`throw new #ReferenceError(123)`),
    Assert);
  // throw_syntax_error //
  Lang._match(
    Intrinsic.throw_syntax_error(123),
    Lang.parseExpression(`throw new #SyntaxError(123)`),
    Assert);
  ////////////////////////////////////////////
  // (Reflect && Object && Array) >> Reader //
  ////////////////////////////////////////////
  // apply //
  Lang._match(
    Intrinsic.apply(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Reflect.apply(123, 456, 789)`),
    Assert);
  // construct //
  Lang._match(
    Intrinsic.construct(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      null),
    Lang.parseExpression(`#Reflect.construct(123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.construct(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Reflect.construct(123, 456, 789)`),
    Assert);
  // get //
  Lang._match(
    Intrinsic.get(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      null),
    Lang.parseExpression(`#Reflect.get(123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.get(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Reflect.get(123, 456, 789)`),
    Assert);
  // onw_keys //
  Lang._match(
    Intrinsic.own_keys(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Reflect.ownKeys(123)`),
    Assert);
  // get_prototype_of //
  Lang._match(
    Intrinsic.get_prototype_of(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Reflect.getPrototypeOf(123)`),
    Assert);
  // has //
  Lang._match(
    Intrinsic.has(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`#Reflect.has(123, 456)`),
    Assert);
  // get_own_property_descriptor //
  Lang._match(
    Intrinsic.get_own_property_descriptor(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`#Reflect.getOwnPropertyDescriptor(123, 456)`),
    Assert);
  // is_extensible //
  Lang._match(
    Intrinsic.is_extensible(Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Reflect.isExtensible(123)`),
    Assert);
  // keys //
  Lang._match(
    Intrinsic.keys(Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Object.keys(123)`),
    Assert);
  // slice //
  Lang._match(
    Intrinsic.slice(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456), null),
    Lang.parseExpression(`#Array.prototype.slice(@123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.slice(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456), Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Array.prototype.slice(@123, 456, 789)`),
    Assert);
  // concat //
  Lang._match(
    Intrinsic.concat([Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456)]),
    Lang.parseExpression(`#Array.prototype.concat(@#Array.of(), 123, 456)`),
    Assert);
  // includes //
  Lang._match(
    Intrinsic.includes(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`#Array.prototype.includes(@123, 456)`),
    Assert);
  ////////////////////////////////////////////
  // (Reflect && Object && Array) >> Writer //
  ////////////////////////////////////////////
  // prevent_extensions && finalize_success //
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.PrimitiveExpression(123),
      false,
      Intrinsic._success_result),
    Lang.parseExpression(`#Reflect.preventExtensions(123)`),
    Assert);
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Object.preventExtensions(123)`),
    Assert);
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.PrimitiveExpression(123),
      false,
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`(#Reflect.preventExtensions(123), 456)`),
    Assert);
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic._success_result),
    Lang.parseExpression(`(
      #Reflect.preventExtensions(123) ?
      true :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  Assert.throws(
    () => Intrinsic.prevent_extensions(
      Tree.PrimitiveExpression(123),
      false,
      Intrinsic._target_result),
    new Error("Cannot return the target"));
  Lang._match(
    Intrinsic.prevent_extensions(
      Tree.PrimitiveExpression(123),
      true,
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`(
      #Reflect.preventExtensions(123) ?
      456 :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  // delete_property //
  Lang._match(
    Intrinsic.delete_property(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      false,
      Intrinsic._success_result),
    Lang.parseExpression(`#Reflect.deleteProperty(123, 456)`),
    Assert);
  // set //
  Lang._match(
    Intrinsic.set(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789),
      null,
      false,
      Intrinsic._success_result),
    Lang.parseExpression(`#Reflect.set(123, 456, 789)`),
    Assert);
  Lang._match(
    Intrinsic.set(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789),
      Tree.PrimitiveExpression(0),
      false,
      Intrinsic._success_result),
    Lang.parseExpression(`#Reflect.set(123, 456, 789, 0)`),
      Assert);
  // set_prototype_of //
  Lang._match(
    Intrinsic.set_prototype_of(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Object.setPrototypeOf(123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.set_prototype_of(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      false,
      Intrinsic._success_result),
    Lang.parseExpression(`#Reflect.setPrototypeOf(123, 456)`),
    Assert);
  // define_property //
  Assert.throws(
    () => Intrinsic.define_property(
      Tree.PrimitiveExpression("target"),
      Tree.PrimitiveExpression("key"),
      {
        __proto__: null,
        [global.Symbol("foo")]: Tree.PrimitiveExpression("bar")}),
    new global.Error("Invalid symbol property for descriptor"));
  Lang._match(
    Intrinsic.define_property(
      Tree.PrimitiveExpression("target"),
      Tree.PrimitiveExpression("key"),
      {
        __proto__: null,
        value: Tree.PrimitiveExpression("value"),
        writable: Tree.PrimitiveExpression("writable"),
        enumerable: Tree.PrimitiveExpression("enumerable"),
        configurable: Tree.PrimitiveExpression("configurable")},
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Object.defineProperty(
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
      Tree.PrimitiveExpression("target"),
      Tree.PrimitiveExpression("key"),
      {
        __proto__: null,
        value: Tree.PrimitiveExpression("value"),
        writable: true,
        enumerable: false},
      false,
      Intrinsic._success_result),
    Lang.parseExpression(`#Reflect.defineProperty(
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
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Object.freeze(123)`),
    Assert);
  Lang._match(
    Intrinsic.freeze(
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic._success_result),
    Lang.parseExpression(`(#Object.freeze(123), true)`),
    Assert);
  Lang._match(
    Intrinsic.freeze(
      Tree.PrimitiveExpression(123),
      true,
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`(#Object.freeze(123), 456)`),
    Assert);
  Assert.throws(
    () => Intrinsic.freeze(
      Tree.PrimitiveExpression(123),
      false,
      Intrinsic._target_result),
    new Error("Must check the result"));
  // assign //
  Lang._match(
    Intrinsic.assign(
      Tree.PrimitiveExpression(123),
      [
        Tree.PrimitiveExpression(456),
        Tree.PrimitiveExpression(789)],
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Object.assign(123, 456, 789)`),
    Assert);
  // fill //
  Lang._match(
    Intrinsic.fill(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      null,
      null,
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Array.prototype.fill(@123, 456)`),
    Assert);
  Lang._match(
    Intrinsic.fill(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789),
      null,
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Array.prototype.fill(@123, 456, 789)`),
    Assert);
  Lang._match(
    Intrinsic.fill(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789),
      Tree.PrimitiveExpression(0),
      true,
      Intrinsic._target_result),
    Lang.parseExpression(`#Array.prototype.fill(@123, 456, 789, 0)`),
    Assert);
  Assert.throws(
    () => Intrinsic.fill(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      null,
      Tree.PrimitiveExpression(789),
      true,
      Intrinsic._target_result),
    new Error("Array.prototype.fill: start cannot be null while end is not null"));
  // push //
  Lang._match(
    Intrinsic.push(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      true,
      Intrinsic._success_result),
    Lang.parseExpression(`(#Array.prototype.push(@123, 456), true)`),
    Assert);
  Assert.throws(
    () => Intrinsic.push(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      true,
      Intrinsic._target_result),
    new Error("push cannot return the target"));
}, []);
