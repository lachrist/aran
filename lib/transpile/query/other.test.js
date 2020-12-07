"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Parse = require("../../parse.js");
const Other = require("./other.js");

////////////////////////////////////
// _is_use_strict_statement_array //
////////////////////////////////////

Assert.deepEqual(Other._has_use_strict_directive(Parse.module(`
  "foo";
  "bar";
  "use strict";
`).body), true);
Assert.deepEqual(Other._has_use_strict_directive(Parse.module(`
  "foo";
  "bar";
`).body), false);
Assert.deepEqual(Other._has_use_strict_directive(Parse.module(`
  123;
  "use strict";
`).body), false);
Assert.deepEqual(Other._has_use_strict_directive(Parse.module(`
  f();
  "use strict";
`).body), false);
Assert.deepEqual(Other._has_use_strict_directive(Parse.module(`
  debugger;
  "use strict";
`).body), false);

// //////////////////////////////////////////////////////////////////////////////////
// // _is_function_declaration_statement && _is_not_function_declaration_statement //
// //////////////////////////////////////////////////////////////////////////////////
//
// Assert.deepEqual(Other._is_function_declaration_statement(Parse.module(`function f () {}`).body[0]), true);
// Assert.deepEqual(Other._is_function_declaration_statement(Parse.module(`123;`).body[0]), false);
// Assert.deepEqual(Other._is_not_function_declaration_statement(Parse.module(`function f () {}`).body[0]), false);
// Assert.deepEqual(Other._is_not_function_declaration_statement(Parse.module(`123;`).body[0]), true);
//
// ////////////////////////
// // is_spread_argument //
// ////////////////////////
//
// Assert.deepEqual(Other._is_spread_argument(Parse.module(`f(...xs);`).body[0].expression.arguments[0]), true);
// Assert.deepEqual(Other._is_spread_argument(Parse.module(`f(x);`).body[0].expression.arguments[0]), false);
//
// ////////////////////////
// // is_not_spread_argument //
// ////////////////////////
//
// Assert.deepEqual(Other._is_not_spread_argument(Parse.module(`f(...xs);`).body[0].expression.arguments[0]), false);
// Assert.deepEqual(Other._is_not_spread_argument(Parse.module(`f(x);`).body[0].expression.arguments[0]), true);
//
// //////////////////////////
// // is_identifier_patter //
// //////////////////////////
//
// Assert.deepEqual(Other._is_identifier_pattern(Parse.module(`x = 123;`).body[0].expression.left), true);
// Assert.deepEqual(Other._is_identifier_pattern(Parse.module(`[x1, x2, x3] = 123;`).body[0].expression.left), false);
//
// ///////////////////////
// // _is_static_method //
// ///////////////////////
//
// Assert.deepEqual(Other._is_static_method(Parse.module(`(class { constructor () {} });`).body[0].expression.body.body[0]), false);
// Assert.deepEqual(Other._is_static_method(Parse.module(`(class { foo () {} });`).body[0].expression.body.body[0]), false);
// Assert.deepEqual(Other._is_static_method(Parse.module(`(class { static foo () {} });`).body[0].expression.body.body[0]), true);
//
// /////////////////////////
// // _is_instance_method //
// /////////////////////////
//
// Assert.deepEqual(Other._is_instance_method(Parse.module(`(class { constructor () {} });`).body[0].expression.body.body[0]), false);
// Assert.deepEqual(Other._is_instance_method(Parse.module(`(class { foo () {} });`).body[0].expression.body.body[0]), true);
// Assert.deepEqual(Other._is_instance_method(Parse.module(`(class { static foo () {} });`).body[0].expression.body.body[0]), false);
//
// ////////////////////////////
// // _is_constructor_method //
// ////////////////////////////
//
// Assert.deepEqual(Other._is_constructor_method(Parse.module(`(class { constructor () {} });`).body[0].expression.body.body[0]), true);
// Assert.deepEqual(Other._is_constructor_method(Parse.module(`(class { foo () {} });`).body[0].expression.body.body[0]), false);
//
// /////////////////////////
// // _is_spread_property //
// /////////////////////////
//
// Assert.deepEqual(Other._is_spread_property(Parse.module(`({...123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_spread_property(Parse.module(`({foo:123});`).body[0].expression.properties[0]), false);
//
// /////////////////////////////
// // _is_not_spread_property //
// /////////////////////////////
//
// Assert.deepEqual(Other._is_not_spread_property(Parse.module(`({...123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_not_spread_property(Parse.module(`({foo:123});`).body[0].expression.properties[0]), true);
//
// ////////////////////////
// // _is_proto_property //
// ////////////////////////
//
// Assert.deepEqual(Other._is_proto_property(Parse.module(`({__proto__:123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_proto_property(Parse.module(`({"__proto__":123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_proto_property(Parse.module(`({["__proto__"]: 123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_proto_property(Parse.module(`({get __proto__ () { 123; }});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_proto_property(Parse.module(`({...123});`).body[0].expression.properties[0]), false);
//
// ////////////////////////////
// // _is_not_proto_property //
// ////////////////////////////
//
// Assert.deepEqual(Other._is_not_proto_property(Parse.module(`({__proto__:123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_not_proto_property(Parse.module(`({"__proto__":123});`).body[0].expression.properties[0]), false);
// Assert.deepEqual(Other._is_not_proto_property(Parse.module(`({["__proto__"]: 123});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_not_proto_property(Parse.module(`({get __proto__ () { 123; }});`).body[0].expression.properties[0]), true);
// Assert.deepEqual(Other._is_not_proto_property(Parse.module(`({...123});`).body[0].expression.properties[0]), true);
//
// //////////////////////////
// // _get_consequent_case //
// //////////////////////////
//
// Assert.deepEqual(
//   Other._get_consequent_case(
//     Parse.module(`switch (123) { case 456: 789; }`).body[0].cases[0]),
//   Parse.module(`switch (123) { case 456: 789; }`).body[0].cases[0].consequent);

////////////////////
// _get_valuation //
////////////////////

Other._get_valuation(Parse.module(`let x = 1;`).body[0], false);
Other._get_valuation(Parse.module(`debugger;`).body[0], false);
Other._get_valuation(Parse.module(`function f () {}`).body[0], false);
Other._get_valuation(Parse.module(`;`).body[0], false);
Other._get_valuation(Parse.module(`class C {};`).body[0], false);
Other._get_valuation(Parse.module(`123;`).body[0], true);
Other._get_valuation(Parse.module(`{; 123; }`).body[0], true);
Other._get_valuation(Parse.module(`{;;}`).body[0], false);
Other._get_valuation(Parse.module(`l: break l;`).body[0].body, "l");
Other._get_valuation(Parse.module(`l: break l;`).body[0], false);
Other._get_valuation(Parse.module(`l: k : break l;`).body[0].body, "l");
Other._get_valuation(Parse.module(`while (123) break;`).body[0].body, null);
