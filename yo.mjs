
export * from "./yo.mjs";

// export {k as kk} from "./yo.mjs";
//
//
//
//

variables = {
  kind: "import" | "let" | "const" | "var" | "function",
  name: Identifier,
  data: {
    exports: [Specifier],
    import: null | {
      source: String,
      specifier: null | Specifier
    }
  }
}

exports.MODULE = (scope, variables, callback) => {};

exports.MODULE = (scope, completion, callback1, callback2) => Tree.__MODULE__(
  callback1(scope),
  callback2(scope));

exports._import(scope, identifier, specifier, source) => (
  Base.Declare(scope, "import", identifier, {source, specifier}),
  Tree._import(identifier, source, specifier));

exports.read(scope, identifier) => (
  kind === "import" ?
  Tree.import(identifier, tag.source, tag.key) :
  ...);

// meta

exports._export = (scope, identifier, specifier) => (
  _identifier = Stratum._meta("export_" + identifier),
  Tree._export(_identifier, specifier));

exports._export(scope, identifier, specifier) => (
  Meta.ExportBox(
    scope,

exports._write(scope, identifier, expression) => (
  ...,
  ArrayLite.reduce(
    tag.specifiers,
    (expression, specifier) => Tree.sequence(
      expression,
      Meta.export(
        scope,
        specifier,
        access(null)))));




exports._aggregate(scope, specifier1, specifier2, source) => Tree._aggregate(specifier1, specifier2, source);

////////////
// Import //
////////////

import variable:
  - always base
  - carry source & nullable key

import {k as x} from "source";
x;
>> import {k as x} from "source";
>> const imp = (source, specifier) {
>>   switch (source) {
>>     case "source":
>>       switch (specifier) {
>>         case "k": return x;
>> }
>>
>> {
>>   trap.import("source", "k", imp("source", "k")); }

import * as x from "source";
x;
>> import * as x from "source";
>> {
>>   traps.import("source", null, x); }

////////////
// Export //
////////////

- real export variable
  - always meta
  - carry key

- fake export variable
  - always base
  - carry array of specifiers

// Inlined declaration easy to desugar:
export let x = 123;
>> let x = 123;
>> export {x as x}

let x = 123;
export {x as k};
x = 456;
>> let _x;
>> export {_x as k};
>> exp = (specifier, value) => {
>>   switch (specifier) {
>>     "k": _x = value; break;
>>     default: throw new "this-should-never-happen";
>>   }
>> };
>>
>> {
>>   let $x;
>>   ($x = 123, _x = traps.export("k", $x));
>>   ($x = 456, _x = traps.export("k", $x)); }

export default 123;
>> let _d;
>> export {_d as default};
>> {
>>   _d = traps.exports("default", 123); }

///////////////
// Aggregate //
///////////////

export { k1 as k2 } from "source.mjs";
>> export { k1 as k2} from "source.mjs";
>> {
>>   traps.aggregate("source.mjs", "k1", "k2"); }

export * from "source.mjs";
>> export * from "source.mjs";
>> {
>>   traps.aggregate("source.mjs", null, null); }

export * as k from "source.mjs";
>> export * as k from "source.mjs";
>> {
>>   traps.aggregate("source.mjs", null, "k"); }


export default EXPR
export {x as}





//
// console.log("yo1");
//
// let _x;
//
// export {_x as k};
//
// // throw "boum";
//
// let x;
//
// x = 123;
// _x = exported(k, );
//
// export function f () {
//   x = 456;
//   _x = exported(k, x);
// };
//
// export function g () { console.log("yo", x); };
