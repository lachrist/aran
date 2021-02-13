"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Variable = require("./variable.js");

// data Source
//   = CompleteScript
//   | PartialScript
//   | Module
//   | StrictEval (Maybe Function)
//   | PartialSloppyEval (Maybe Function) [Identifier]
//   | CompleteSloppyEval (Either Function Global) [Identifier]
// 
// data Function
//   | Constructor
//   | Method
//   | DerivedConstructor
//   | Function
// 
// type Global = Boolean

const PROGRAM_MODE = null;

const GLOBAL_PROGRAM_MODE = true;

const LOCAL_PROGRAM_MODE = false;

/////////////////
// Constructor //
/////////////////

exports.Module = () => ({
  type: "module"});

exports.EnclaveModule = () => ({
  type: "module"});

exports.Script = () => ({
  type: "complete-script"});

exports.EnclaveScript = () => ({
  type: "partial-script"});

exports.EnclaveEval = (strict, mode) => (
  strict ?
  {
    type: "strict-eval",
    mode: mode} :
  {
    type: "partial-sloppy-eval",
    mode: mode,
    scope: []});

exports.Eval = () => ({
  type: "complete-sloppy-eval",
  mode: GLOBAL_PROGRAM_MODE,
  scope: []});

///////////
// Query //
///////////

exports.isEval = ({type}) => (
  source.type !== "strict-eval" ||
  source.type === "complete-sloppy-eval" ||
  source.type === "partial-sloppy-eval");

exports.isModule = ({type}) => type === "module";

exports.isScript = ({type}) => (
  type === "complete-script" ||
  type === "partial-script");

exports.isEnclave = ({type}) => (
  Throw.assert(
    (
      type !== "module" &&
      type !== "strict-eval"),
    null,
    `Module source and strict-eval source are completeness-independent`),
  type === "partial-script" ||
  type === "partial-sloppy-eval");

exports.isStrict = (source) => (
  source.type === "module" ||
  source.type === "strict-eval");

exports.isMode = (source, sort) => (
  checkEval(source),
  (
    sort === "program" ?
    (
      source.type === "complete-sloppy-eval" ?
      (
        source.mode === LOCAL_PROGRAM_MODE ||
        source.mode === GLOBAL_PROGRAM_MODE) :
      source.mode === PROGRAM_MODE) :
    source.mode === sort));

////////////////
// Convertion //
////////////////

exports.toEval = (source) => (
  source.type === "module" ?
  {
    type: "strict-eval",
    mode: PROGRAM_MODE} :
  (
    source.type === "complete-script" ?
    {
      type: "complete-sloppy-eval",
      mode: GLOBAL_PROGRAM_MODE,
      scope: []} :
    (
      source.type === "partial-script" ?
      {
        type: "partial-sloppy-eval",
        mode: PROGRAM_MODE,
        scope: []} :
      source)));

////////////
// Extend //
////////////

const isEval = exports.isEval;

const checkEval = (source) => Throw.assert(
  isEval(source),
  null,
  `Expected an eval source`);

exports.extendStrict = (source) => (
  checkEval(source),
  (
    source.type === "strict-eval" ?
    source :
    {
      type: "strict-eval",
      mode: (
        source.type === "partial-sloppy-eval" ?
        (
          (
            source.mode === GLOBAL_PROGRAM_MODE ||
            source.mode === LOCAL_PROGRAM_MODE) ?
          PROGRAM_MODE :
          source.mode) :
        // console.assert(source.type === complete-sloppy-eval)
        source.mode)}));

exports.extendFunction = (source, sort) => (
  checkEval(source),
  (
    source.type === "strict-eval" ?
    {
      type: "strict-eval",
      mode: sort} :
    {
      type: source.type,
      mode: sort,
      scope: source.scope}));

exports.extendArrow = (source) => (
  checkEval(source),
  (
    source.type === "strict-eval" ?
    source :
    {
      type: "complete-sloppy-eval",
      mode: (
        source.type === "complete-sloppy-eval" ?
        source.mode :
        // console.assert(source.type === "partial-sloppy-eval")
        (
          source.mode === PROGRAM_MODE ?
          LOCAL_PROGRAM_MODE :
          source.mode)),
      scope: []}));

exports.extendScope = (source, variables) => (
  checkEval(source),
  (
    source.type === "strict-eval" ?
    source :
    {
      type: source.type,
      mode: source.mode,
      scope: ArrayLite.concat(
        source.scope,
        ArrayLite.map(
          ArrayLite.filter(variables, Variable.isRigid),
          Variable.getName))}));
