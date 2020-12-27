"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Mapping = require("./mapping.js");
const Result = require("./result.js");

////////////
// _empty //
////////////

Assert.deepEqual(
  Result._empty(),
  {
    identifier: Mapping._empty(),
    label: Mapping._empty(),
    structural: null});

////////////////////////
// _single_identifier //
////////////////////////

Assert.deepEqual(
  Result._single_identifier("path", "input", "input"),
  {
    identifier: Mapping._empty(),
    label: Mapping._empty(),
    structural: null});

Assert.deepEqual(
  Result._single_identifier("path", "foo", "input"),
  {
    identifier: `Input missmatch at path between foo and input`,
    label: Mapping._empty(),
    structural: null});

Assert.deepEqual(
  Result._single_identifier("path", "input", "foo"),
  {
    identifier: `Input missmatch at path between input and foo`,
    label: Mapping._empty(),
    structural: null});

Assert.deepEqual(
  Result._single_identifier("path", "foo", "bar"),
  {
    identifier: Mapping._single("foo", "bar"),
    label: Mapping._empty(),
    structural: null});

///////////////
// _checkout //
///////////////

Assert.deepEqual(
  Result._checkout(
    {
      identifier: Mapping._single("foo", "bar"),
      label: Mapping._single("quz", "buz"),
      structural: null},
    (mapping1, mapping2) => (
      Assert.deepEqual(
        mapping1,
        Mapping._single("foo", "bar")),
      Assert.deepEqual(
        mapping2,
        Mapping._single("quz", "buz")),
      "taz"),
    (message) => Assert.fail()),
  "taz");

Assert.deepEqual(
  Result._checkout(
    {
      identifier: "foo",
      label: Mapping._empty(),
      structural: null},
    (mapping1, mapping2) => Assert.fail(),
    (message) => (
      Assert.deepEqual(message, "foo"),
      "bar")),
  "bar");

Assert.deepEqual(
  Result._checkout(
    {
      identifier: Mapping._empty(),
      label: "foo",
      structural: null},
    (mapping1, mapping2) => Assert.fail(),
    (message) => (
      Assert.deepEqual(message, "foo"),
      "bar")),
  "bar");

Assert.deepEqual(
  Result._checkout(
    {
      identifier: Mapping._empty(),
      label: Mapping._empty(),
      structural: "foo"},
    (mapping1, mapping2) => Assert.fail(),
    (message) => (
      Assert.deepEqual(message, "foo"),
      "bar")),
  "bar");

///////////////////
// _single_label //
///////////////////

Assert.deepEqual(
  Result._single_label("path", "foo", "bar"),
  {
    identifier: Mapping._empty(),
    label: Mapping._single("foo", "bar"),
    structural: null});

////////////
// _check //
////////////

Assert.deepEqual(
  Result._check(
    "path1",
    "foo",
    "foo",
    () => Result._single_label("path2", "bar", "qux")),
  Result._single_label("path2", "bar", "qux"));

Assert.deepEqual(
  Result._check(
    "path",
    123,
    456,
    () => Assert.fail()),
  {
    identifier: Mapping._empty(),
    label: {__proto__: null},
    structural: "Structural mismatch at path between 123 and 456"});

Assert.deepEqual(
  Result._check(
    "path",
    "foo",
    "bar",
    () => Assert.fail()),
  {
    identifier: Mapping._empty(),
    label: {__proto__: null},
    structural: "Structural mismatch at path between \"foo\" and \"bar\""});

//////////////
// _combine //
//////////////

Assert.deepEqual(
  Result._combine(
    "path1",
    Result._single_identifier("path2", "foo", "bar"),
    Result._single_label("path4", "qux", "taz")),
  {
    identifier: Mapping._single("foo", "bar"),
    label: Mapping._single("qux", "taz"),
    structural: null});

Assert.deepEqual(
  Result._combine(
    "path1",
    Result._check(
      "path2",
      123,
      456,
      () => Assert.fail()),
    Result._empty()),
  {
    identifier: Mapping._empty(),
    label: Mapping._empty(),
    structural: "Structural mismatch at path2 between 123 and 456"});

//////////////////////
// _bind_identifier //
//////////////////////

Assert.deepEqual(
  Result._bind_identifier(
    "path1",
    ["foo"],
    ["bar"],
    Result._single_identifier("path2", "foo", "bar")),
  Result._empty());

Assert.deepEqual(
  Result._bind_identifier(
    "path1",
    ["input"],
    ["bar"],
    Result._empty()),
  {
    identifier: `Input identifier in binding at path1`,
    label: Mapping._empty(),
    structural: null});

/////////////////
// _bind_label //
/////////////////

Assert.deepEqual(
  Result._bind_label(
    "path1",
    ["foo"],
    ["bar"],
    Result._single_label("path2", "foo", "bar")),
  Result._empty());
