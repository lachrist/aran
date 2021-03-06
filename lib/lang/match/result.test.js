"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Mapping = require("./mapping.js");
const Result = require("./result.js");

///////////
// Empty //
///////////

Assert.deepEqual(
  Result.Empty(),
  {
    identifier: Mapping.Empty(),
    label: Mapping.Empty(),
    structural: null});

//////////////////////
// SingleIdentifier //
//////////////////////

Assert.deepEqual(
  Result.SingleIdentifier("path", "input", "input"),
  {
    identifier: Mapping.Empty(),
    label: Mapping.Empty(),
    structural: null});

Assert.deepEqual(
  Result.SingleIdentifier("path", "foo", "input"),
  {
    identifier: `Input missmatch at path between foo and input`,
    label: Mapping.Empty(),
    structural: null});

Assert.deepEqual(
  Result.SingleIdentifier("path", "input", "foo"),
  {
    identifier: `Input missmatch at path between input and foo`,
    label: Mapping.Empty(),
    structural: null});

Assert.deepEqual(
  Result.SingleIdentifier("path", "foo", "bar"),
  {
    identifier: Mapping.Single("foo", "bar"),
    label: Mapping.Empty(),
    structural: null});

/////////////////
// SingleLabel //
/////////////////

Assert.deepEqual(
  Result.SingleLabel("path", "foo", "bar"),
  {
    identifier: Mapping.Empty(),
    label: Mapping.Single("foo", "bar"),
    structural: null});

/////////////////////
// getErrorMessage //
/////////////////////

Assert.deepEqual(
  Result.getErrorMessage(
    {
      identifier: Mapping.Single("foo", "bar"),
      label: Mapping.Single("quz", "buz"),
      structural: null}),
  null);

Assert.deepEqual(
  Result.getErrorMessage(
    {
      identifier: "foo",
      label: Mapping.Empty(),
      structural: null}),
  "foo");

Assert.deepEqual(
  Result.getErrorMessage(
    {
      identifier: Mapping.Empty(),
      label: "foo",
      structural: null}),
  "foo");

Assert.deepEqual(
  Result.getErrorMessage(
    {
      identifier: Mapping.Empty(),
      label: Mapping.Empty(),
      structural: "foo"}),
  "foo");

///////////
// check //
///////////

Assert.deepEqual(
  Result.check(
    "path1",
    "foo",
    "foo",
    () => Result.SingleLabel("path2", "bar", "qux")),
  Result.SingleLabel("path2", "bar", "qux"));

Assert.deepEqual(
  Result.check(
    "path",
    123,
    456,
    () => Assert.fail()),
  {
    identifier: Mapping.Empty(),
    label: {__proto__: null},
    structural: "Structural mismatch at path between 123 and 456"});

Assert.deepEqual(
  Result.check(
    "path",
    "foo",
    "bar",
    () => Assert.fail()),
  {
    identifier: Mapping.Empty(),
    label: {__proto__: null},
    structural: "Structural mismatch at path between \"foo\" and \"bar\""});

/////////////
// combine //
/////////////

Assert.deepEqual(
  Result.combine(
    "path1",
    Result.SingleIdentifier("path2", "foo", "bar"),
    Result.SingleLabel("path4", "qux", "taz")),
  {
    identifier: Mapping.Single("foo", "bar"),
    label: Mapping.Single("qux", "taz"),
    structural: null});

Assert.deepEqual(
  Result.combine(
    "path1",
    Result.check(
      "path2",
      123,
      456,
      () => Assert.fail()),
    Result.Empty()),
  {
    identifier: Mapping.Empty(),
    label: Mapping.Empty(),
    structural: "Structural mismatch at path2 between 123 and 456"});

////////////////////
// bindIdentifier //
////////////////////

Assert.deepEqual(
  Result.bindIdentifier(
    "path1",
    "foo",
    "bar",
    Result.SingleIdentifier("path2", "foo", "bar")),
  Result.Empty());

Assert.deepEqual(
  Result.bindIdentifier(
    "path1",
    "input",
    "bar",
    Result.Empty()),
  {
    identifier: `Binding input mismatch at path1 between input and bar`,
    label: Mapping.Empty(),
    structural: null});

///////////////
// bindLabel //
///////////////

Assert.deepEqual(
  Result.bindLabel(
    "path1",
    "foo",
    "bar",
    Result.SingleLabel("path2", "foo", "bar")),
  Result.Empty());
