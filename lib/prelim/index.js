"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Source = require("./source.js");
const Variable = require("./variable.js");
const Scoping = require("./scoping.js");

// options = {
//   globals: [Variable],
//   parser: {
//     parseScript: (string, number) -> estree.Program
//     parseModule: (string, number) -> estree.Program
//   }
//   type: "module" | "script" | "eval",
//   enclave: null | boolean,
//   strict: null | boolean,
//   mode: null | "program" | "constructor" | "derived-constructor" | "method" | "function",
//   source: null | Source
// }

exports.getVariableName = Variable.getName;



exports.parse = (code, options) => {
  const source = convert(options);
  const node = Parser.parse(code, source, parser);
  return Scoping.scopeProgram(node, source);
};

const convert = (options) => (
  options.source !== null ?
  (
    Throw.assert(
      (
        options.type === "eval" &&
        options.mode === null &&
        options.strict === null &&
        options.enclave === null),
      null,
      `Invalid pre-existing source configuration`),
    options.source) :
  (
    Throw.assert(
      options.enclave !== null,
      null,
      `If a pre-existing is not provided, then the enclave must be specified`),
    (
      (
        options.type === "eval" &&
        options.enclave) ?
      (
        Throw.assert(
          (
            options.strict !== null &&
            options.mode !== null),
          null,
          `Enclave eval source requires: strict and mode`),
        Source.make(
          options.type,
          options.enclave,
          {
            strict: options.strict,
            mode: options.mode})) :
      (
        Throw.assert(
          (
            options.strict === null &&
            options.mode === null),
          null,
          `Non enclave eval source require non strict mode`),
        Source.make(source.type, source.enclave)))));

  // (
  //   options.type === "eval" &&
  //   options.source !== null
  // (
  //   options.type === "eval" &&
  //   options.enclave) ?
  // Source.make(options.type, options.enclave),
  // options.type === "module" ?
  // (
  //   Throw.assert(
  //     (
  //       options.enclave !== null &&
  //       options.strict === null &&
  //       options.mode === null &&
  //       options.source === null),
  //     null,
  //     `Invalid module options`),
  //   (
  //     options.enclave ?
  //     Source.EnclaveModule() :
  //     Source.Module())) :
  // (
  //   options.type === "script" ?
  //   (
  //     Throw.assert(
  //       (
  //         options.enclave !== null &&
  //         options.strict === null &&
  //         options.mode === null &&
  //         options.source === null),
  //       null,
  //       `Invalid script options`),
  //     (
  //       options.enclave ?
  //       Source.EnclaveScript() :
  //       Source.Script())) :
  //   // console.assert(options.type === "eval")
  //   (
  //     options.source === null ?
  //     (
  //       Throw.assert(
  //         options.enclave !== null,
  //         null,
  //         `Invalid eval options`),
  //       (
  //         options.enclave ?
  //         (
  //           Throw.assert(
  //             (
  //               options.strict !== null &&
  //               options.mode !== null),
  //             null,
  //             `Invalid global eval options (enclave)`),
  //           Source.EnclaveEval(options.strict, options.mode)) :
  //         (
  //           Throw.assert(
  //             (
  //               options.strict === null &&
  //               options.mode === null),
  //             null,
  //             `Invalid global options`),
  //           Source.Eval()))) :
  //     (
  //       Throw.assert(
  //         (
  //           options.enclave === null &&
  //           options.mode === null &&
  //           options.source === null),
  //         null,
  //         `Invalid local eval options`),
  //       source))));
