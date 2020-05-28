"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
const Dispatch = require("./dispatch.js");
const Parser = require("../../test/parser/index.js");

const callbacks = () => {
  __proto__: null,
  // Block //
  BLOCK: () => { Assert.fail() },
  // Statement - Blockless //
  Lift: () => { Assert.fail() },
  Return: () => { Assert.fail() },
  Break: () => { Assert.fail() },
  Continue: () => { Assert.fail() },
  Debugger: () => { Assert.fail() },
  // Statement - Blockfull //
  Lone: () => { Assert.fail() },
  If: () => { Assert.fail() },
  While: () => { Assert.fail() },
  Try: () => { Assert.fail() },
  // Expression - Producers //
  primitive: () => { Assert.fail() },
  builtin: () => { Assert.fail() },
  arrow: () => { Assert.fail() },
  function: () => { Assert.fail() },
  read: () => { Assert.fail() },
  // Expression - Consumers //
  write: () => { Assert.fail() },
  sequence: () => { Assert.fail() },
  conditional: () => { Assert.fail() },
  throw: () => { Assert.fail() },
  eval: () => { Assert.fail() },
  // Expression - Combiners //
  apply: () => { Assert.fail() },
  construct: () => { Assert.fail() },
  unary: () => { Assert.fail() },
  binary: () => { Assert.fail() },
  object: () => { Assert.fail() }
};

////////////////
// Expression //
////////////////

Assert.deepEqual(Dispatch._expression(Parser.parse("x"), "foo", {
  __proto__: callbacks,
  read: (context, aran_expression, aran_identifier) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_expression, Parser.parse("x"));
    Assert.deepEqual(aran_identifier, "x");
    return "bar";
  }
}), "bar");

Assert.deepEqual(Dispatch._expression(Parser.parse("!x"), "foo", {
  __proto__: callbacks,
  unary: (context, aran_expression_1, unary_operator, aran_expression_2) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_expression_1, Parser.parse("!x"));
    Assert.deepEqual(unary_operator, "!");
    Assert.deepEqual(aran_expression_2, Parser.parse("x"));
    return "bar";
  }
}), "bar");

Assert.deepEqual(Dispatch._expression(Parser.parse("(x ? y : z)"), "foo", {
  __proto__: callbacks,
  conditional: (context, aran_expression_1, aran_expression_2, aran_expression_3, aran_expression_4) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_expression_1, Parser.parse("(x ? y : z)"));
    Assert.deepEqual(aran_expression_2, Parser.parse("x"));
    Assert.deepEqual(aran_expression_3, Parser.parse("y"));
    Assert.deepEqual(aran_expression_4, Parser.parse("z"));
    return "bar";
  }
}), "bar");

///////////////
// Statement //
///////////////

Assert.deepEqual(Dispatch._statement(Parser.Parse("debugger;")[0], "foo", {
  __proto__: callbacks,
  Debugger: (context, aran_statement) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_statement, Parser.Parse("debugger;")[0]);
    return "bar";
  }
}), "bar");

Assert.deepEqual(Dispatch._statement(Parser.Parse("break l;")[0], "foo", {
  __proto__: callbacks,
  Break: (context, aran_statement, aran_label) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_statement, Parser.Parse("break l;")[0]);
    Assert.deepEqual(aran_label, "l");
    return "bar";
  }
}), "bar");

Assert.deepEqual(Dispatch._statement(Parser.Parse("k: l: {}")[0], "foo", {
  __proto__: callbacks,
  Lone: (context, aran_statement, aran_label_array, aran_block) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_statement, Parser.Parse("k: l: {}")[0]);
    Assert.deepEqual(aran_label_array, ["k", "l"]);
    Assert.deepEqual(aran_block, Parser.PARSE("{}"));
    return "bar";
  }
}), "bar");

Assert.deepEqual(Dispatch._statement(Parser.Parse("k: l: while (x) {}")[0], "foo", {
  __proto__: callbacks,
  While: (context, aran_statement, aran_label_array, aran_expression, aran_block) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_statement, Parser.Parse("k: l: while (x) {}")[0]);
    Assert.deepEqual(aran_label_array, ["k", "l"]);
    Assert.deepEqual(aran_expression, Parser.parse("x"));
    Assert.deepEqual(aran_block, Parser.PARSE("{}"));
    return "bar";
  }
}), "bar");

Assert.deepEqual(Dispatch._statement(Parser.Parse("k: l: if (x) { let y; } else { let z; }")[0], "foo", {
  __proto__: callbacks,
  If: (context, aran_statement, aran_label_array, aran_expression, aran_block_1, aran_block_2) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_statement, Parser.Parse("k: l: if (x) { let y; } else { let z; }")[0]);
    Assert.deepEqual(aran_label_array, ["k", "l"]);
    Assert.deepEqual(aran_expression, Parser.parse("x"));
    Assert.deepEqual(aran_block_1, Parser.PARSE("{ let y; }"));
    Assert.deepEqual(aran_block_2, Parser.PARSE("{ let z; }"));
    return "bar";
  }
}), "bar");

///////////
// Block //
///////////

Assert.deepEqual(Dispatch._block(Parser.PARSE("{ let x, y; x; y; }"), "foo", {
  __proto__: callbacks,
  BLOCK: (context, aran_block, aran_identifier_array, aran_statement_array) => {
    Assert.deepEqual(context, "foo");
    Assert.deepEqual(aran_block, Parser.PARSE("{ let x, y; x; y; }"));
    Assert.deepEqual(aran_identifier_array, ["x", "y"]);
    Assert.deepEqual(aran_statement_array, Parser.Parse("x; y;"));
    return "bar";
  }
}), "bar");
