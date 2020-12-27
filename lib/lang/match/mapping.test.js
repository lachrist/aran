"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Mapping = require("./mapping.js");

////////////
// _empty //
////////////

Assert.deepEqual(
  Mapping._empty(),
  {
    __proto__:null});

/////////////
// _single //
/////////////

Assert.deepEqual(
  Mapping._single("foo", "bar"),
  {
    __proto__: null,
    foo: "bar"});

//////////////
// _combine //
//////////////

Assert.deepEqual(
  Mapping._combine(
    "path1",
    "foo",
    Mapping._empty()),
  "foo");

Assert.deepEqual(
  Mapping._combine(
    "path1",
    Mapping._empty(),
    "foo"),
  "foo");

Assert.deepEqual(
  Mapping._combine(
    "path1",
    Mapping._single("foo", "bar"),
    Mapping._single("qux", "taz")),
  {
    __proto__: null,
    foo: "bar",
    qux: "taz"});

Assert.deepEqual(
  Mapping._combine(
    "path1",
    Mapping._single("foo", "bar"),
    Mapping._single("foo", "bar")),
  {
    __proto__: null,
    foo: "bar"});

Assert.deepEqual(
  Mapping._combine(
    "path1",
    Mapping._single("foo", "bar"),
    Mapping._single("foo", "qux")),
  `Combination mismatch at path1 between bar and qux for foo`);

///////////
// _bind //
///////////

Assert.deepEqual(
  Mapping._bind(
    "path1",
    [],
    [],
    "foo"),
  "foo");

Assert.deepEqual(
  Mapping._bind(
    "path1",
    ["foo", "bar"],
    ["bar", "qux"],
    Mapping._combine(
      "path2",
      Mapping._single("foo", "qux"),
      Mapping._single("taz", "buz"))),
  {
    __proto__: null,
    taz: "buz"});

Assert.deepEqual(
  Mapping._bind(
    "path1",
    ["foo"],
    ["bar", "foo"],
    Mapping._empty()),
  `Binding length mismatch at path1`);

Assert.deepEqual(
  Mapping._bind(
    "path1",
    ["foo"],
    ["bar"],
    Mapping._single("foo", "qux")),
  `Binding mismatch at path1 between foo and qux`);
