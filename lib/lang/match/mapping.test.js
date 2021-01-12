"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Mapping = require("./mapping.js");

////////////
// _empty //
////////////

Assert.deepEqual(
  Mapping.Empty(),
  {
    __proto__:null});

/////////////
// _single //
/////////////

Assert.deepEqual(
  Mapping.Single("foo", "bar"),
  {
    __proto__: null,
    foo: "bar"});

//////////////
// _combine //
//////////////

Assert.deepEqual(
  Mapping.combine(
    "path1",
    "foo",
    Mapping.Empty()),
  "foo");

Assert.deepEqual(
  Mapping.combine(
    "path1",
    Mapping.Empty(),
    "foo"),
  "foo");

Assert.deepEqual(
  Mapping.combine(
    "path1",
    Mapping.Single("foo", "bar"),
    Mapping.Single("qux", "taz")),
  {
    __proto__: null,
    foo: "bar",
    qux: "taz"});

Assert.deepEqual(
  Mapping.combine(
    "path1",
    Mapping.Single("foo", "bar"),
    Mapping.Single("foo", "bar")),
  {
    __proto__: null,
    foo: "bar"});

Assert.deepEqual(
  Mapping.combine(
    "path1",
    Mapping.Single("foo", "bar"),
    Mapping.Single("foo", "qux")),
  `Combination mismatch at path1 between bar and qux for foo`);

///////////
// _bind //
///////////

Assert.deepEqual(
  Mapping.bind(
    "path1",
    [],
    [],
    "foo"),
  "foo");

Assert.deepEqual(
  Mapping.bind(
    "path1",
    ["foo", "bar"],
    ["bar", "qux"],
    Mapping.combine(
      "path2",
      Mapping.Single("foo", "qux"),
      Mapping.Single("taz", "buz"))),
  {
    __proto__: null,
    taz: "buz"});

Assert.deepEqual(
  Mapping.bind(
    "path1",
    ["foo"],
    ["bar", "foo"],
    Mapping.Empty()),
  `Binding length mismatch at path1`);

Assert.deepEqual(
  Mapping.bind(
    "path1",
    ["foo"],
    ["bar"],
    Mapping.Single("foo", "qux")),
  `Binding mismatch at path1 between foo and qux`);
