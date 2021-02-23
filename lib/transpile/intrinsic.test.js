"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Lang = require("../lang");
const State = require("./state.js");
const Intrinsic = require("./intrinsic.js");

State.runSession({nodes:[], serials:new Map(), evals:{}}, "cache", () => {
  //////////
  // Grab //
  //////////
  Lang.match(
    Intrinsic.makeGrabExpression("eval"),
    Lang.parseExpression("#eval"),
    Assert);
  Assert.throws(
    () => Intrinsic.makeGrabExpression("foo"),
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
  //     Lang.match(
  //       Intrinsic[key](),
  //       Lang.parseExpression("#" + name),
  //       Assert)});
  ////////////////
  // Convertion //
  ////////////////
  // string //
  Lang.match(
    Intrinsic.makeStringExpression(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#String(123)`),
    Assert);
  // fork_nullish //
  Lang.match(
    Intrinsic.makeNullishExpression(
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
  Lang.match(
    Intrinsic.makeNullishExpression(
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
  Lang.match(
    Intrinsic.makeObjectifyExpression(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Object(123)`),
    Assert);
  // convert_to_array //
  Lang.match(
    Intrinsic.makeArrayifyExpression(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Array.from(123)`),
    Assert);
  //////////////////
  // Construction //
  //////////////////
  // construct_symbol //
  Lang.match(
    Intrinsic.makeSymbolExpression("foo"),
    Lang.parseExpression(`#Symbol("foo")`),
    Assert);
  // construct_object //
  Lang.match(
    Intrinsic.makeObjectExpression(
      Tree.PrimitiveExpression(123),
      [
        [
          Tree.PrimitiveExpression("foo"),
          Tree.PrimitiveExpression("bar")]]),
    Lang.parseExpression(`{
      __proto__: 123,
      foo: "bar"}`),
    Assert);

  // Lang.match(
  //   Intrinsic.makeObjectExpression(
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
  // Lang.match(
  //   Intrinsic.makeObjectExpression(
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
  Lang.match(
    Intrinsic.makeArrayExpression(
      [
        Tree.PrimitiveExpression(123),
        Tree.PrimitiveExpression(456)]),
    Lang.parseExpression(`#Array.of(123, 456)`),
    Assert);
  // construct_proxy //
  Lang.match(
    Intrinsic.makeProxyExpression(
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
  Lang.match(
    Intrinsic.makeRegExpExpression(123, 456),
    Lang.parseExpression(`new #RegExp(123, 456)`),
    Assert);
  // throw_type_error //
  Lang.match(
    Intrinsic.makeThrowTypeErrorExpression(123),
    Lang.parseExpression(`throw new #TypeError(123)`),
    Assert);
  // throw_reference_error //
  Lang.match(
    Intrinsic.makeThrowReferenceErrorExpression(123),
    Lang.parseExpression(`throw new #ReferenceError(123)`),
    Assert);
  // throw_syntax_error //
  Lang.match(
    Intrinsic.makeThrowSyntaxErrorExpression(123),
    Lang.parseExpression(`throw new #SyntaxError(123)`),
    Assert);
  ////////////////////////////////////////////
  // (Reflect && Object && Array) >> Reader //
  ////////////////////////////////////////////
  // apply //
  Lang.match(
    Intrinsic.makeApplyExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Reflect.apply(123, 456, 789)`),
    Assert);
  // construct //
  Lang.match(
    Intrinsic.makeConstructExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      null),
    Lang.parseExpression(`#Reflect.construct(123, 456)`),
    Assert);
  Lang.match(
    Intrinsic.makeConstructExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Reflect.construct(123, 456, 789)`),
    Assert);
  // get //
  Lang.match(
    Intrinsic.makeGetExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      null),
    Lang.parseExpression(`#Reflect.get(123, 456)`),
    Assert);
  Lang.match(
    Intrinsic.makeGetExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Reflect.get(123, 456, 789)`),
    Assert);
  // onw_keys //
  Lang.match(
    Intrinsic.makeOwnKeysExpression(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Reflect.ownKeys(123)`),
    Assert);
  // get_prototype_of //
  Lang.match(
    Intrinsic.makeGetPrototypeOfExpression(
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Reflect.getPrototypeOf(123)`),
    Assert);
  // has //
  Lang.match(
    Intrinsic.makeHasExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`#Reflect.has(123, 456)`),
    Assert);
  // get_own_property_descriptor //
  Lang.match(
    Intrinsic.makeGetOwnPropertyDescriptorExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`#Reflect.getOwnPropertyDescriptor(123, 456)`),
    Assert);
  // is_extensible //
  Lang.match(
    Intrinsic.makeIsExtensibleExpression(Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Reflect.isExtensible(123)`),
    Assert);
  // keys //
  Lang.match(
    Intrinsic.makeKeysExpression(Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`#Object.keys(123)`),
    Assert);
  // slice //
  Lang.match(
    Intrinsic.makeSliceExpression(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456), null),
    Lang.parseExpression(`#Array.prototype.slice(@123, 456)`),
    Assert);
  Lang.match(
    Intrinsic.makeSliceExpression(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456), Tree.PrimitiveExpression(789)),
    Lang.parseExpression(`#Array.prototype.slice(@123, 456, 789)`),
    Assert);
  // concat //
  Lang.match(
    Intrinsic.makeConcatExpression([Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456)]),
    Lang.parseExpression(`#Array.prototype.concat(@#Array.of(), 123, 456)`),
    Assert);
  // includes //
  Lang.match(
    Intrinsic.makeIncludesExpression(Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`#Array.prototype.includes(@123, 456)`),
    Assert);
  ////////////////////////////////////////////
  // (Reflect && Object && Array) >> Writer //
  ////////////////////////////////////////////
  // prevent_extensions && finalize_success //
  Lang.match(
    Intrinsic.makePreventExtensionsExpression(
      Tree.PrimitiveExpression(123),
      false,
      Intrinsic.SUCCESS_RESULT),
    Lang.parseExpression(`#Reflect.preventExtensions(123)`),
    Assert);
  Lang.match(
    Intrinsic.makePreventExtensionsExpression(
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic.TARGET_RESULT),
    Lang.parseExpression(`#Object.preventExtensions(123)`),
    Assert);
  Lang.match(
    Intrinsic.makePreventExtensionsExpression(
      Tree.PrimitiveExpression(123),
      false,
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`(#Reflect.preventExtensions(123), 456)`),
    Assert);
  Lang.match(
    Intrinsic.makePreventExtensionsExpression(
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic.SUCCESS_RESULT),
    Lang.parseExpression(`(
      #Reflect.preventExtensions(123) ?
      true :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  Assert.throws(
    () => Intrinsic.makePreventExtensionsExpression(
      Tree.PrimitiveExpression(123),
      false,
      Intrinsic.TARGET_RESULT),
    new Error("Cannot return the target"));
  Lang.match(
    Intrinsic.makePreventExtensionsExpression(
      Tree.PrimitiveExpression(123),
      true,
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`(
      #Reflect.preventExtensions(123) ?
      456 :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  // delete_property //
  Lang.match(
    Intrinsic.makeDeletePropertyExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      false,
      Intrinsic.SUCCESS_RESULT),
    Lang.parseExpression(`#Reflect.deleteProperty(123, 456)`),
    Assert);
  // set //
  Lang.match(
    Intrinsic.makeSetExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789),
      null,
      false,
      Intrinsic.SUCCESS_RESULT),
    Lang.parseExpression(`#Reflect.set(123, 456, 789)`),
    Assert);
  Lang.match(
    Intrinsic.makeSetExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789),
      Tree.PrimitiveExpression(0),
      false,
      Intrinsic.SUCCESS_RESULT),
    Lang.parseExpression(`#Reflect.set(123, 456, 789, 0)`),
      Assert);
  // set_prototype_of //
  Lang.match(
    Intrinsic.makeSetPrototypeOfExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      true,
      Intrinsic.TARGET_RESULT),
    Lang.parseExpression(`#Object.setPrototypeOf(123, 456)`),
    Assert);
  Lang.match(
    Intrinsic.makeSetPrototypeOfExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456),
      false,
      Intrinsic.SUCCESS_RESULT),
    Lang.parseExpression(`#Reflect.setPrototypeOf(123, 456)`),
    Assert);
  // define_property //
  Lang.match(
    Intrinsic.makeDefinePropertyExpression(
      Tree.PrimitiveExpression("target"),
      Tree.PrimitiveExpression("key"),
      {
        __proto__: null,
        value: Tree.PrimitiveExpression("value"),
        writable: Tree.PrimitiveExpression("writable"),
        enumerable: Tree.PrimitiveExpression("enumerable"),
        configurable: Tree.PrimitiveExpression("configurable")},
      true,
      Intrinsic.TARGET_RESULT),
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
  Lang.match(
    Intrinsic.makeDefinePropertyExpression(
      Tree.PrimitiveExpression("target"),
      Tree.PrimitiveExpression("key"),
      {
        __proto__: null,
        value: Tree.PrimitiveExpression("value"),
        writable: true,
        enumerable: false},
      false,
      Intrinsic.SUCCESS_RESULT),
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
  Lang.match(
    Intrinsic.makeFreezeExpression(
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic.TARGET_RESULT),
    Lang.parseExpression(`#Object.freeze(123)`),
    Assert);
  Lang.match(
    Intrinsic.makeFreezeExpression(
      Tree.PrimitiveExpression(123),
      true,
      Intrinsic.SUCCESS_RESULT),
    Lang.parseExpression(`(#Object.freeze(123), true)`),
    Assert);
  Lang.match(
    Intrinsic.makeFreezeExpression(
      Tree.PrimitiveExpression(123),
      true,
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression(`(#Object.freeze(123), 456)`),
    Assert);
  Assert.throws(
    () => Intrinsic.makeFreezeExpression(
      Tree.PrimitiveExpression(123),
      false,
      Intrinsic.TARGET_RESULT),
    new Error("Must check the result"));
  // assign //
  Lang.match(
    Intrinsic.makeAssignExpression(
      Tree.PrimitiveExpression(123),
      [
        Tree.PrimitiveExpression(456),
        Tree.PrimitiveExpression(789)],
      true,
      Intrinsic.TARGET_RESULT),
    Lang.parseExpression(`#Object.assign(123, 456, 789)`),
    Assert);
}, []);
