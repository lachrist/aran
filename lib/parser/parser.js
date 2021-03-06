"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_RegExp_prototype_exec = global.RegExp.prototype.exec;

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Source = require("../source.js");

// Because columns are not corrected,
// if the code does not end with a newline character then Program.loc.end.column will be erroneous

const offset = {
  range: {
    start: 56,
    end: 6},
  line: {
    start: 1,
    end: 1}};

exports.parse = (code, source, parse, options) => {
  if (Source.getType(source) === "module") {
    return parse(code, "module", options, null);
  }
  if (Source.getType(source) === "script") {
    return parse(code, "script", options, null);
  }
  // console.assert(source.getType(source) === "eval")
  let hashbang = "";
  {
    const parts = global_Reflect_apply(global_RegExp_prototype_exec, /^(\#\!.*\n)([\s\S]*)$/, [code]);
    if (parts !== null) {
      hashbang = parts[1];
      code = parts[2];
    }
  }
  const directive = Source.isStrict(source) ? `"use strict";` : `"use sloppy";`;
  let node = null;
  // a newline is appended to code to protect against single-line comment
  if (Source.getMode(source) === "derived-constructor") {
    node = parse(`${hashbang}${directive} (class extends null { constructor ()    {${"\n"}${code}${"\n"}} });`, "script", options, offset);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (Source.getMode(source) === "constructor") {
    node = parse(`${hashbang}${directive} (class              { constructor ()    {${"\n"}${code}${"\n"}} });`, "script", options, offset);
    node.body = node.body[1].expression.body.body[0].value.body.body;
  } else if (Source.getMode(source) === "method") {
    node = parse(`${hashbang}${directive} (                   { method      ()    {${"\n"}${code}${"\n"}} });`, "script", options, offset);
    node.body = node.body[1].expression.properties[0].value.body.body;
  } else if (Source.getMode(source) === "function") {
    node = parse(`${hashbang}${directive} (                     function    ()    {${"\n"}${code}${"\n"}}  );`, "script", options, offset);
    node.body = node.body[1].expression.body.body;
  } else {
    // console.assert(Source.getMode(source) === "program")
    node = parse(`${hashbang}${directive} (                                 () => {${"\n"}${code}${"\n"}}  );`, "script", options, offset);
    node.body = node.body[1].expression.body.body;
  }
  Throw.assert(!hasReturnStatement(node.body), Throw.SyntaxError, `Illegal return statement`);
  return node;
};

const hasReturnStatement = (nodes) => {
  nodes = ArrayLite.reverse(nodes);
  let length = nodes.length;
  while (length > 0) {
    const node = nodes[--length];
    if (node.type === "ReturnStatement") {
      return true;
    }
    if (node.type === "IfStatement") {
      if (node.alternate) {
        nodes[length++] = node.alternate;
      }
      nodes[length++] = node.consequent;
    } else if (node.type === "LabeledStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "ForStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "ForOfStatement" || node.type === "ForInStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "BlockStatement") {
      for (let index = node.body.length - 1; index >= 0; index--) {
        nodes[length++] = node.body[index];
      }
    } else if (node.type === "TryStatement") {
      if (node.finalizer) {
        nodes[length++] = node.finalizer;
      }
      if (node.handler) {
        nodes[length++] = node.handler.body;
      }
      nodes[length++] = node.block;
    } else if (node.type === "SwitchStatement") {
      for (let index1 = node.cases.length - 1; index1 >= 0; index1--) {
        for (let index2 = node.cases[index1].consequent.length - 1; index2 >= 0; index2--) {
          nodes[length++] = node.cases[index1].consequent[index2];
        }
      }
    }
  }
  return false;
};
