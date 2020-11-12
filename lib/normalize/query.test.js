"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Query = require("./query.js");
const Acorn = require("acorn");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

////////////////////////////////////
// _is_use_strict_statement_array //
////////////////////////////////////

Assert.deepEqual(Query._is_use_strict_statement_array(parse(`
  "foo";
  "bar";
  "use strict";
`).body), true);
Assert.deepEqual(Query._is_use_strict_statement_array(parse(`
  "foo";
  "bar";
`).body), false);
Assert.deepEqual(Query._is_use_strict_statement_array(parse(`
  123;
  "use strict";
`).body), false);
Assert.deepEqual(Query._is_use_strict_statement_array(parse(`
  f();
  "use strict";
`).body), false);
Assert.deepEqual(Query._is_use_strict_statement_array(parse(`
  debugger;
  "use strict";
`).body), false);

//////////////////////////////////////////////////////////////////////////////////
// _is_function_declaration_statement && _is_not_function_declaration_statement //
//////////////////////////////////////////////////////////////////////////////////

Assert.deepEqual(Query._is_function_declaration_statement(parse(`function f () {}`).body[0]), true);
Assert.deepEqual(Query._is_function_declaration_statement(parse(`123;`).body[0]), false);
Assert.deepEqual(Query._is_not_function_declaration_statement(parse(`function f () {}`).body[0]), false);
Assert.deepEqual(Query._is_not_function_declaration_statement(parse(`123;`).body[0]), true);

////////////////////////
// is_spread_argument //
////////////////////////

Assert.deepEqual(Query._is_spread_argument(parse(`f(...xs);`).body[0].expression.arguments[0]), true);
Assert.deepEqual(Query._is_spread_argument(parse(`f(x);`).body[0].expression.arguments[0]), false);

////////////////////////
// is_not_spread_argument //
////////////////////////

Assert.deepEqual(Query._is_not_spread_argument(parse(`f(...xs);`).body[0].expression.arguments[0]), false);
Assert.deepEqual(Query._is_not_spread_argument(parse(`f(x);`).body[0].expression.arguments[0]), true);

//////////////////////////
// is_identifier_patter //
//////////////////////////

Assert.deepEqual(Query._is_identifier_pattern(parse(`x = 123;`).body[0].expression.left), true);
Assert.deepEqual(Query._is_identifier_pattern(parse(`[x1, x2, x3] = 123;`).body[0].expression.left), false);

///////////////////////
// _is_static_method //
///////////////////////

Assert.deepEqual(Query._is_static_method(parse(`(class { constructor () {} });`).body[0].expression.body.body[0]), false);
Assert.deepEqual(Query._is_static_method(parse(`(class { foo () {} });`).body[0].expression.body.body[0]), false);
Assert.deepEqual(Query._is_static_method(parse(`(class { static foo () {} });`).body[0].expression.body.body[0]), true);

/////////////////////////
// _is_instance_method //
/////////////////////////

Assert.deepEqual(Query._is_instance_method(parse(`(class { constructor () {} });`).body[0].expression.body.body[0]), false);
Assert.deepEqual(Query._is_instance_method(parse(`(class { foo () {} });`).body[0].expression.body.body[0]), true);
Assert.deepEqual(Query._is_instance_method(parse(`(class { static foo () {} });`).body[0].expression.body.body[0]), false);

////////////////////////////
// _is_constructor_method //
////////////////////////////

Assert.deepEqual(Query._is_constructor_method(parse(`(class { constructor () {} });`).body[0].expression.body.body[0]), true);
Assert.deepEqual(Query._is_constructor_method(parse(`(class { foo () {} });`).body[0].expression.body.body[0]), false);

/////////////////////////
// _is_spread_property //
/////////////////////////

Assert.deepEqual(Query._is_spread_property(parse(`({...123});`).body[0].expression.properties[0]), true);
Assert.deepEqual(Query._is_spread_property(parse(`({foo:123});`).body[0].expression.properties[0]), false);

/////////////////////////////
// _is_not_spread_property //
/////////////////////////////

Assert.deepEqual(Query._is_not_spread_property(parse(`({...123});`).body[0].expression.properties[0]), false);
Assert.deepEqual(Query._is_not_spread_property(parse(`({foo:123});`).body[0].expression.properties[0]), true);

////////////////////////
// _is_proto_property //
////////////////////////

Assert.deepEqual(Query._is_proto_property(parse(`({__proto__:123});`).body[0].expression.properties[0]), true);
Assert.deepEqual(Query._is_proto_property(parse(`({"__proto__":123});`).body[0].expression.properties[0]), true);
Assert.deepEqual(Query._is_proto_property(parse(`({["__proto__"]: 123});`).body[0].expression.properties[0]), false);
Assert.deepEqual(Query._is_proto_property(parse(`({get __proto__ () { 123; }});`).body[0].expression.properties[0]), false);
Assert.deepEqual(Query._is_proto_property(parse(`({...123});`).body[0].expression.properties[0]), false);

////////////////////////////
// _is_not_proto_property //
////////////////////////////

Assert.deepEqual(Query._is_not_proto_property(parse(`({__proto__:123});`).body[0].expression.properties[0]), false);
Assert.deepEqual(Query._is_not_proto_property(parse(`({"__proto__":123});`).body[0].expression.properties[0]), false);
Assert.deepEqual(Query._is_not_proto_property(parse(`({["__proto__"]: 123});`).body[0].expression.properties[0]), true);
Assert.deepEqual(Query._is_not_proto_property(parse(`({get __proto__ () { 123; }});`).body[0].expression.properties[0]), true);
Assert.deepEqual(Query._is_not_proto_property(parse(`({...123});`).body[0].expression.properties[0]), true);

//////////////////////////
// _get_consequent_case //
//////////////////////////

Assert.deepEqual(
  Query._get_consequent_case(
    parse(`switch (123) { case 456: 789; }`).body[0].cases[0]),
  parse(`switch (123) { case 456: 789; }`).body[0].cases[0].consequent);

////////////////////
// _get_valuation //
////////////////////

Query._get_valuation(parse(`let x = 1;`).body[0], false);
Query._get_valuation(parse(`debugger;`).body[0], false);
Query._get_valuation(parse(`function f () {}`).body[0], false);
Query._get_valuation(parse(`;`).body[0], false);
Query._get_valuation(parse(`class C {};`).body[0], false);
Query._get_valuation(parse(`123;`).body[0], true);
Query._get_valuation(parse(`{; 123; }`).body[0], true);
Query._get_valuation(parse(`{;;}`).body[0], false);
Query._get_valuation(parse(`l: break l;`).body[0].body, "l");
Query._get_valuation(parse(`l: break l;`).body[0], false);
Query._get_valuation(parse(`l: k : break l;`).body[0].body, "l");
Query._get_valuation(parse(`while (123) break;`).body[0].body, null);
