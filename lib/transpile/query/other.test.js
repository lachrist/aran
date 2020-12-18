"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ParseExternal = require("../../parse-external.js");
const Other = require("./other.js");

////////////////////////////////////
// _is_use_strict_statement_array //
////////////////////////////////////

Assert.deepEqual(Other._has_use_strict_directive(ParseExternal(`
  "foo";
  "bar";
  "use strict";
`, {source:"module"}).body), true);
Assert.deepEqual(Other._has_use_strict_directive(ParseExternal(`
  "foo";
  "bar";
`, {source:"module"}).body), false);
Assert.deepEqual(Other._has_use_strict_directive(ParseExternal(`
  123;
  "use strict";
`, {source:"module"}).body), false);
Assert.deepEqual(Other._has_use_strict_directive(ParseExternal(`
  f();
  "use strict";
`, {source:"module"}).body), false);
Assert.deepEqual(Other._has_use_strict_directive(ParseExternal(`
  debugger;
  "use strict";
`, {source:"module"}).body), false);

// //////////////////////////////////////////////////////////////////////////////////
// // _is_function_declaration_statement && _is_not_function_declaration_statement //
// //////////////////////////////////////////////////////////////////////////////////
//
// Assert.deepEqual(Other._is_function_declaration_statement(ParseExternal(`function f () {}`).body[0]), true);
// Assert.deepEqual(Other._is_function_declaration_statement(ParseExternal(`123;`).body[0]), false);
// Assert.deepEqual(Other._is_not_function_declaration_statement(ParseExternal(`function f () {}`).body[0]), false);
// Assert.deepEqual(Other._is_not_function_declaration_statement(ParseExternal(`123;`).body[0]), true);
//
// ////////////////////////
// // is_spread_argument //
// ////////////////////////
//
// Assert.deepEqual(Other._is_spread_argument(ParseExternal(`f(...xs);`).body[0].expression.arguments[0]), true);
// Assert.deepEqual(Other._is_spread_argument(ParseExternal(`f(x);`).body[0].expression.arguments[0]), false);
//
// ////////////////////////
// // is_not_spread_argument //
// ////////////////////////
//
// Assert.deepEqual(Other._is_not_spread_argument(ParseExternal(`f(...xs);`).body[0].expression.arguments[0]), false);
// Assert.deepEqual(Other._is_not_spread_argument(ParseExternal(`f(x);`).body[0].expression.arguments[0]), true);
//
// //////////////////////////
// // is_identifier_patter //
// //////////////////////////
//
// Assert.deepEqual(Other._is_identifier_pattern(ParseExternal(`x = 123;`).body[0].expression.left), true);
// Assert.deepEqual(Other._is_identifier_pattern(ParseExternal(`[x1, x2, x3] = 123;`).body[0].expression.left), false);
//
// ///////////////////////
// // _is_static_method //
// ///////////////////////
//
// Assert.deepEqual(Other._is_static_method(ParseExternal(`(class { constructor () {} });`).body[0].expression.body.body[0]), false);
// Assert.deepEqual(Other._is_static_method(ParseExternal(`(class { foo () {} });`).body[0].expression.body.body[0]), false);
// Assert.deepEqual(Other._is_static_method(ParseExternal(`(class { static foo () {} });`).body[0].expression.body.body[0]), true);
//
// /////////////////////////
// // _is_instance_method //
// /////////////////////////
//
// Assert.deepEqual(Other._is_instance_method(ParseExternal(`(class { constructor () {} });`).body[0].expression.body.body[0]), false);
// Assert.deepEqual(Other._is_instance_method(ParseExternal(`(class { foo () {} });`).body[0].expression.body.body[0]), true);
// Assert.deepEqual(Other._is_instance_method(ParseExternal(`(class { static foo () {} });`).body[0].expression.body.body[0]), false);
//
// ////////////////////////////
// // _is_constructor_method //
// ////////////////////////////
//
// Assert.deepEqual(Other._is_constructor_method(ParseExternal(`(class { constructor () {} });`).body[0].expression.body.body[0]), true);
// Assert.deepEqual(Other._is_constructor_method(ParseExternal(`(class { foo () {} });`).body[0].expression.body.body[0]), false);
//
// /////////////////////////
// // _is_spread_property //
// /////////////////////////
//
// Assert.deepEqual(Other._is_spread_property(ParseExternal(`({...123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_spread_property(ParseExternal(`({foo:123});`).body[0].expression.properties[0]), false);
//
// /////////////////////////////
// // _is_not_spread_property //
// /////////////////////////////
//
// Assert.deepEqual(Other._is_not_spread_property(ParseExternal(`({...123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_not_spread_property(ParseExternal(`({foo:123});`).body[0].expression.properties[0]), true);
//
// ////////////////////////
// // _is_proto_property //
// ////////////////////////
//
// Assert.deepEqual(Other._is_proto_property(ParseExternal(`({__proto__:123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_proto_property(ParseExternal(`({"__proto__":123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_proto_property(ParseExternal(`({["__proto__"]: 123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_proto_property(ParseExternal(`({get __proto__ () { 123; }});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_proto_property(ParseExternal(`({...123});`).body[0].expression.properties[0]), false);
//
// ////////////////////////////
// // _is_not_proto_property //
// ////////////////////////////
//
// Assert.deepEqual(Other._is_not_proto_property(ParseExternal(`({__proto__:123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_not_proto_property(ParseExternal(`({"__proto__":123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_not_proto_property(ParseExternal(`({["__proto__"]: 123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_not_proto_property(ParseExternal(`({get __proto__ () { 123; }});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_not_proto_property(ParseExternal(`({...123});`).body[0].expression.properties[0]), true);
//
// //////////////////////////
// // _get_consequent_case //
// //////////////////////////
//
// Assert.deepEqual(
//   Other._get_consequent_case(
//     ParseExternal(`switch (123) { case 456: 789; }`).body[0].cases[0]),
//   ParseExternal(`switch (123) { case 456: 789; }`).body[0].cases[0].consequent);

////////////////////
// _get_valuation //
////////////////////

Other._get_valuation(ParseExternal(`let x = 1;`, {source:"module"}).body[0], false);
Other._get_valuation(ParseExternal(`debugger;`, {source:"module"}).body[0], false);
Other._get_valuation(ParseExternal(`function f () {}`, {source:"module"}).body[0], false);
Other._get_valuation(ParseExternal(`;`, {source:"module"}).body[0], false);
Other._get_valuation(ParseExternal(`class C {};`, {source:"module"}).body[0], false);
Other._get_valuation(ParseExternal(`123;`, {source:"module"}).body[0], true);
Other._get_valuation(ParseExternal(`{; 123; }`, {source:"module"}).body[0], true);
Other._get_valuation(ParseExternal(`{;;}`, {source:"module"}).body[0], false);
Other._get_valuation(ParseExternal(`l: break l;`, {source:"module"}).body[0].body, "l");
Other._get_valuation(ParseExternal(`l: break l;`, {source:"module"}).body[0], false);
Other._get_valuation(ParseExternal(`l: k : break l;`, {source:"module"}).body[0].body, "l");
Other._get_valuation(ParseExternal(`while (123) break;`, {source:"module"}).body[0].body, null);
