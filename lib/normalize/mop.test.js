"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const State = require("./state.js");
const Mop = require("./mop.js");
const Lang = require("../lang/index.js");
const Tree = require("./tree.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  /////////////
  // Special //
  /////////////
  // convert //
  Lang._match_expression(
    Mop.convert(() => Tree.primitive(123)),
    Lang.parse_expression(`(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      123 :
      #Object(123))`),
      Assert);
  // create //
  Lang._match_expression(
    Mop.create(
      Tree.primitive(123),
      [
        [
          Tree.primitive("foo"),
          {
            __proto__: null,
            value: Tree.primitive("value"),
            writable: true,
            enumerable: true,
            configurable: true}]]),
    Lang.parse_expression(`{
      __proto__: 123,
      foo: "value"}`),
    Assert);
  Lang._match_expression(
    Mop.create(
      Tree.primitive(123),
      [
        [
          Tree.primitive("foo"),
          {
            __proto__: null,
            value: Tree.primitive("value")}]]),
    Lang.parse_expression(`#Object.create(
      123,
      {
        __proto__: null,
        foo: {
          __proto__: null,
          value: "value"}})`),
    Assert);
  //////////
  // read //
  //////////
  // get //
  Lang._match_expression(
    Mop.get(Tree.primitive(123), Tree.primitive(456), null),
    Lang.parse_expression(`#Reflect.get(123, 456)`),
    Assert);
  Lang._match_expression(
    Mop.get(Tree.primitive(123), Tree.primitive(456), Tree.primitive(789)),
    Lang.parse_expression(`#Reflect.get(123, 456, 789)`),
    Assert);
  // onwKeys //
  Lang._match_expression(
    Mop.ownKeys(Tree.primitive(123)),
    Lang.parse_expression(`#Reflect.ownKeys(123)`),
    Assert);
  // getPrototypeOf //
  Lang._match_expression(
    Mop.getPrototypeOf(Tree.primitive(123)),
    Lang.parse_expression(`#Reflect.getPrototypeOf(123)`),
    Assert);
  // has //
  Lang._match_expression(
    Mop.has(Tree.primitive(123), Tree.primitive(456)),
    Lang.parse_expression(`#Reflect.has(123, 456)`),
    Assert);
  // getOwnPropertyDescriptor //
  Lang._match_expression(
    Mop.getOwnPropertyDescriptor(Tree.primitive(123), Tree.primitive(456)),
    Lang.parse_expression(`#Reflect.getOwnPropertyDescriptor(123, 456)`),
    Assert);
  // apply //
  Lang._match_expression(
    Mop.apply(Tree.primitive(123), Tree.primitive(456), Tree.primitive(789)),
    Lang.parse_expression(`#Reflect.apply(123, 456, 789)`),
    Assert);
  // construct //
  Lang._match_expression(
    Mop.construct(Tree.primitive(123), Tree.primitive(456), null),
    Lang.parse_expression(`#Reflect.construct(123, 456)`),
    Assert);
  Lang._match_expression(
    Mop.construct(Tree.primitive(123), Tree.primitive(456), Tree.primitive(789)),
    Lang.parse_expression(`#Reflect.construct(123, 456, 789)`),
    Assert);
  // isExtensible //
  Lang._match_expression(
    Mop.isExtensible(Tree.primitive(123)),
    Lang.parse_expression(`#Reflect.isExtensible(123)`),
    Assert);
  ///////////
  // write //
  ///////////
  // preventExtensions && finalize //
  Lang._match_expression(
    Mop.preventExtensions(
      Tree.primitive(123),
      false,
      Mop._success_result),
    Lang.parse_expression(`#Reflect.preventExtensions(123)`),
    Assert);
  Lang._match_expression(
    Mop.preventExtensions(
      Tree.primitive(123),
      false,
      Mop._target_result),
    Lang.parse_expression(`#Object.preventExtensions(123)`),
    Assert);
  Lang._match_expression(
    Mop.preventExtensions(
      Tree.primitive(123),
      false,
      Tree.primitive(456)),
    Lang.parse_expression(`(#Reflect.preventExtensions(123), 456)`),
    Assert);
  Lang._match_expression(
    Mop.preventExtensions(
      Tree.primitive(123),
      true,
      Mop._success_result),
    Lang.parse_expression(`(
      #Reflect.preventExtensions(123) ?
      true :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  Assert.throws(
    () => Mop.preventExtensions(
      Tree.primitive(123),
      true,
      Mop._target_result),
    new Error("Cannot return the target"));
  Lang._match_expression(
    Mop.preventExtensions(
      Tree.primitive(123),
      true,
      Tree.primitive(456)),
    Lang.parse_expression(`(
      #Reflect.preventExtensions(123) ?
      456 :
      throw new #TypeError("Cannot prevent object extensions"))`),
    Assert);
  // deleteProperty //
  Lang._match_expression(
    Mop.deleteProperty(
      Tree.primitive(123),
      Tree.primitive(456),
      false,
      Mop._success_result),
    Lang.parse_expression(`#Reflect.deleteProperty(123, 456)`),
    Assert);
  // set //
  Lang._match_expression(
    Mop.set(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789),
      null,
      false,
      Mop._success_result),
    Lang.parse_expression(`#Reflect.set(123, 456, 789)`),
    Assert);
  Lang._match_expression(
    Mop.set(
      Tree.primitive(123),
      Tree.primitive(456),
      Tree.primitive(789),
      Tree.primitive(0),
      false,
      Mop._success_result),
    Lang.parse_expression(`#Reflect.set(123, 456, 789, 0)`),
      Assert);
  // setPrototypeOf //
  Lang._match_expression(
    Mop.setPrototypeOf(
      Tree.primitive(123),
      Tree.primitive(456),
      false,
      Mop._target_result),
    Lang.parse_expression(`#Object.setPrototypeOf(123, 456)`),
    Assert);
  Lang._match_expression(
    Mop.setPrototypeOf(
      Tree.primitive(123),
      Tree.primitive(456),
      false,
      Mop._success_result),
    Lang.parse_expression(`#Reflect.setPrototypeOf(123, 456)`),
    Assert);
  // defineProperty //
  Lang._match_expression(
    Mop.defineProperty(
      Tree.primitive("target"),
      Tree.primitive("key"),
      {
        __proto__: null,
        value: Tree.primitive("value"),
        writable: Tree.primitive("writable"),
        enumerable: Tree.primitive("enumerable"),
        configurable: Tree.primitive("configurable")},
      false,
      Mop._target_result),
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
  Lang._match_expression(
    Mop.defineProperty(
      Tree.primitive("target"),
      Tree.primitive("key"),
      {
        __proto__: null,
        value: Tree.primitive("value"),
        writable: true,
        enumerable: false},
      false,
      Mop._success_result),
    Lang.parse_expression(`#Reflect.defineProperty(
      "target",
      "key",
      {
        __proto__: null,
        value: "value",
        writable: true})`),
    Assert);
});
