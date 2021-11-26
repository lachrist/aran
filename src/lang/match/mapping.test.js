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
  `Combination mismatch at path1 between [foo, bar] and [foo, qux]`);

//////////
// bind //
//////////

Assert.deepEqual(
  Mapping.bind(
    "path1",
    "foo",
    "bar",
    Mapping.Single("foo", "bar")),
  {
    __proto__: null});

Assert.deepEqual(
  Mapping.bind(
    "path1",
    "foo1",
    "bar1",
    Mapping.Single("foo2", "bar2")),
  {
    __proto__: null,
    "foo2": "bar2"});

Assert.deepEqual(
  Mapping.bind(
    "path1",
    "foo",
    "bar",
    `qux`),
  `qux`);

Assert.deepEqual(
  Mapping.bind(
    "path1",
    "foo",
    "bar",
    Mapping.Single("foo", "qux")),
  `Binding mismatch at path1 between [foo, bar] and [foo, qux]`);

Assert.deepEqual(
  Mapping.bind(
    "path1",
    "foo",
    "bar",
    Mapping.Single("qux", "bar")),
  `Binding mismatch at path1 between [foo, bar] and [qux, bar]`);
