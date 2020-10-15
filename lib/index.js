"use strict";
const global_Object_is = global.Object.is;
const global_Array_isArray = global.Array.isArray;
const global_Reflect_defineProperty = global.Reflect.defineProperty;
const global_Error = global.Error;
const global_Map = global.Map;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_split = global.String.prototype.split;
const global_Array_prototype_join = global.Array.prototype.join;
const global_Object_assign = global.Object.assign;
const global_Math_round = global.Math.round;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Stratum = require("./stratum.js");
const Normalize = require("./normalize");
const Instrument = require("./instrument.js");
const Generate = require("./generate.js");
const show = {
  __proto__: null,
  label: Stratum._get_body,
  identifier: identifier => Stratum._is_meta(identifier) ? "%" + Stratum._get_body(Stratum._get_body(identifier)) : Stratum._is_meta(Stratum._get_body(identifier)) ? "#" + Stratum._get_body(Stratum._get_body(identifier)) : Stratum._get_body(Stratum._get_body(identifier))
};
const make_counter_identifier = (identifier, _counter) => (_counter = 0, () => identifier + ++_counter);
const make_instrument_namespace = () => ({
  __proto__: null,
  callee: make_counter_identifier("callee"),
  advice: "advice",
  parameters: "parameters"
});
const make_generate_namespace = () => ({
  __proto__: null,
  callee: make_counter_identifier("CALLEE"),
  apply: "APPLY",
  builtin: "BUILTIN"
});
const parameters = {
  __proto__: null,
  "error": "ERROR",
  "this": "THIS",
  "callee": "CALLEE",
  "arguments": "ARGUMENTS",
  "new.target": "NEW_TARGET"
};
const convert = identifier => (identifier in parameters) ? parameters[identifier] : identifier;
const make_const = value => () => value;
const null_const = make_const(null);
const false_const = make_const(false);
const null_expression_callback_object = {
  __proto__: null
};
const false_expression_callback_object = {
  __proto__: null
};
ArrayLite.forEach(["primitive", "builtin", "read", "arrow", "constructor", "function", "method", "eval", "write", "sequence", "conditional", "throw", "unary", "binary", "object", "construct", "apply"], type => {
  null_expression_callback_object[type] = null_const;
  false_expression_callback_object[type] = false_const;
});
const is_primitive_expression_callback_object = {
  __proto__: false_expression_callback_object,
  primitive: (context, node, primitive) => global_Object_is(context, primitive)
};
const extract_builtin_name_expression_callback_object = {
  __proto__: null_expression_callback_object,
  builtin: (context, node, builtin) => builtin
};
const extract_call_expression_callback_object = {
  __proto__: null_expression_callback_object,
  apply: (context, node, expression1, expression2, expressions) => ({
    __proto__: null,
    callee: expression1,
    this: expression2,
    arguments: expressions
  })
};
const extract_read_identifier_expression_callback_object = {
  __proto__: null_expression_callback_object,
  read: (context, node, identifier) => identifier
};
const apply = (visit, expression1, expression2, expressions, _call, _nullable_identifier) => Tree._dispatch_expression(extract_builtin_name_expression_callback_object, null, expression1) === "Array.of" && Tree._dispatch_expression(is_primitive_expression_callback_object, void 0, expression2) ? {
  type: "ArrayExpression",
  elements: ArrayLite.map(expressions, visit)
} : (_call = Tree._dispatch_expression(extract_call_expression_callback_object, null, expression1), _call !== null && Tree._dispatch_expression(extract_builtin_name_expression_callback_object, null, _call.callee) === "Reflect.get" && Tree._dispatch_expression(is_primitive_expression_callback_object, void 0, _call.this) && _call.arguments.length === 2 && Tree._dispatch_expression(extract_read_identifier_expression_callback_object, null, _call.arguments[0]) === "advice" && Tree._dispatch_expression(extract_read_identifier_expression_callback_object, null, expression2) === "advice" ? {
  type: "CallExpression",
  optional: false,
  callee: {
    type: "MemberExpression",
    optional: false,
    computed: true,
    object: {
      type: "Identifier",
      name: convert("advice")
    },
    property: visit(_call.arguments[1])
  },
  arguments: ArrayLite.map(expressions, visit)
} : null);
const construct = null_const;
const trap_name_array = ["enter", "leave", "success", "break", "continue", "debugger", "primitive", "builtin", "method", "closure", "read", "drop", "write", "failure", "test", "eval", "unary", "binary", "construct", "apply", "object"];
const prototype = {};
global_Reflect_defineProperty(prototype, "builtin", {
  __proto__: null,
  configurable: true,
  value: {
    __proto__: null,
    names: ["Object", "Reflect.defineProperty", "global", "eval", "Symbol.unscopables", "Symbol.iterator", "Function.prototype.arguments@get", "Function.prototype.arguments@set", "Array.prototype.values", "Object.prototype", "Array.from", "Object.create", "Array.of", "Proxy", "RegExp", "TypeError", "ReferenceError", "Reflect.get", "Reflect.has", "Reflect.construct", "Reflect.apply", "Reflect.getPrototypeOf", "Reflect.ownKeys", "Reflect.isExtensible", "Object.keys", "Array.prototype.concat", "Array.prototype.includes", "Array.prototype.slice", "Reflect.set", "Reflect.deleteProperty", "Reflect.setPrototypeOf", "Reflect.getOwnPropertyDescriptor", "Reflect.preventExtensions", "Object.assign", "Object.freeze", "Object.defineProperty", "Object.setPrototypeOf", "Object.preventExtensions", "Array.prototype.fill", "Array.prototype.push"],
    object: {
      __proto__: null,
      ["Object"]: Object,
      ["Reflect.defineProperty"]: Reflect["defineProperty"],
      ["global"]: new Function("return this;")(),
      ["eval"]: eval,
      ["Symbol.unscopables"]: Symbol["unscopables"],
      ["Symbol.iterator"]: Symbol["iterator"],
      ["Function.prototype.arguments@get"]: Reflect.getOwnPropertyDescriptor(Function["prototype"], "arguments").get,
      ["Function.prototype.arguments@set"]: Reflect.getOwnPropertyDescriptor(Function["prototype"], "arguments").set,
      ["Array.prototype.values"]: Array["prototype"]["values"],
      ["Object.prototype"]: Object["prototype"],
      ["Array.from"]: Array["from"],
      ["Object.create"]: Object["create"],
      ["Array.of"]: Array["of"],
      ["Proxy"]: Proxy,
      ["RegExp"]: RegExp,
      ["TypeError"]: TypeError,
      ["ReferenceError"]: ReferenceError,
      ["Reflect.get"]: Reflect["get"],
      ["Reflect.has"]: Reflect["has"],
      ["Reflect.construct"]: Reflect["construct"],
      ["Reflect.apply"]: Reflect["apply"],
      ["Reflect.getPrototypeOf"]: Reflect["getPrototypeOf"],
      ["Reflect.ownKeys"]: Reflect["ownKeys"],
      ["Reflect.isExtensible"]: Reflect["isExtensible"],
      ["Object.keys"]: Object["keys"],
      ["Array.prototype.concat"]: Array["prototype"]["concat"],
      ["Array.prototype.includes"]: Array["prototype"]["includes"],
      ["Array.prototype.slice"]: Array["prototype"]["slice"],
      ["Reflect.set"]: Reflect["set"],
      ["Reflect.deleteProperty"]: Reflect["deleteProperty"],
      ["Reflect.setPrototypeOf"]: Reflect["setPrototypeOf"],
      ["Reflect.getOwnPropertyDescriptor"]: Reflect["getOwnPropertyDescriptor"],
      ["Reflect.preventExtensions"]: Reflect["preventExtensions"],
      ["Object.assign"]: Object["assign"],
      ["Object.freeze"]: Object["freeze"],
      ["Object.defineProperty"]: Object["defineProperty"],
      ["Object.setPrototypeOf"]: Object["setPrototypeOf"],
      ["Object.preventExtensions"]: Object["preventExtensions"],
      ["Array.prototype.fill"]: Array["prototype"]["fill"],
      ["Array.prototype.push"]: Array["prototype"]["push"]
    },
    script: "({\n  __proto__: null,\n  [\"Object\"]: Object,\n[\"Reflect.defineProperty\"]: Reflect[\"defineProperty\"],\n[\"global\"]: ((new Function(\"return this;\"))()),\n[\"eval\"]: eval,\n[\"Symbol.unscopables\"]: Symbol[\"unscopables\"],\n[\"Symbol.iterator\"]: Symbol[\"iterator\"],\n[\"Function.prototype.arguments@get\"]: Reflect.getOwnPropertyDescriptor(Function[\"prototype\"], \"arguments\").get,\n[\"Function.prototype.arguments@set\"]: Reflect.getOwnPropertyDescriptor(Function[\"prototype\"], \"arguments\").set,\n[\"Array.prototype.values\"]: Array[\"prototype\"][\"values\"],\n[\"Object.prototype\"]: Object[\"prototype\"],\n[\"Array.from\"]: Array[\"from\"],\n[\"Object.create\"]: Object[\"create\"],\n[\"Array.of\"]: Array[\"of\"],\n[\"Proxy\"]: Proxy,\n[\"RegExp\"]: RegExp,\n[\"TypeError\"]: TypeError,\n[\"ReferenceError\"]: ReferenceError,\n[\"Reflect.get\"]: Reflect[\"get\"],\n[\"Reflect.has\"]: Reflect[\"has\"],\n[\"Reflect.construct\"]: Reflect[\"construct\"],\n[\"Reflect.apply\"]: Reflect[\"apply\"],\n[\"Reflect.getPrototypeOf\"]: Reflect[\"getPrototypeOf\"],\n[\"Reflect.ownKeys\"]: Reflect[\"ownKeys\"],\n[\"Reflect.isExtensible\"]: Reflect[\"isExtensible\"],\n[\"Object.keys\"]: Object[\"keys\"],\n[\"Array.prototype.concat\"]: Array[\"prototype\"][\"concat\"],\n[\"Array.prototype.includes\"]: Array[\"prototype\"][\"includes\"],\n[\"Array.prototype.slice\"]: Array[\"prototype\"][\"slice\"],\n[\"Reflect.set\"]: Reflect[\"set\"],\n[\"Reflect.deleteProperty\"]: Reflect[\"deleteProperty\"],\n[\"Reflect.setPrototypeOf\"]: Reflect[\"setPrototypeOf\"],\n[\"Reflect.getOwnPropertyDescriptor\"]: Reflect[\"getOwnPropertyDescriptor\"],\n[\"Reflect.preventExtensions\"]: Reflect[\"preventExtensions\"],\n[\"Object.assign\"]: Object[\"assign\"],\n[\"Object.freeze\"]: Object[\"freeze\"],\n[\"Object.defineProperty\"]: Object[\"defineProperty\"],\n[\"Object.setPrototypeOf\"]: Object[\"setPrototypeOf\"],\n[\"Object.preventExtensions\"]: Object[\"preventExtensions\"],\n[\"Array.prototype.fill\"]: Array[\"prototype\"][\"fill\"],\n[\"Array.prototype.push\"]: Array[\"prototype\"][\"push\"]});",
    estree: {
      "type": "Program",
      "body": [{
        "type": "ExpressionStatement",
        "expression": {
          "type": "ObjectExpression",
          "properties": [{
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": false,
            "key": {
              "type": "Identifier",
              "name": "__proto__"
            },
            "value": {
              "type": "Literal",
              "value": null,
              "raw": "null"
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object",
              "raw": "\"Object\""
            },
            "value": {
              "type": "Identifier",
              "name": "Object"
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.defineProperty",
              "raw": "\"Reflect.defineProperty\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "defineProperty",
                "raw": "\"defineProperty\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "global",
              "raw": "\"global\""
            },
            "value": {
              "type": "CallExpression",
              "callee": {
                "type": "NewExpression",
                "callee": {
                  "type": "Identifier",
                  "name": "Function"
                },
                "arguments": [{
                  "type": "Literal",
                  "value": "return this;",
                  "raw": "\"return this;\""
                }]
              },
              "arguments": [],
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "eval",
              "raw": "\"eval\""
            },
            "value": {
              "type": "Identifier",
              "name": "eval"
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Symbol.unscopables",
              "raw": "\"Symbol.unscopables\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Symbol"
              },
              "property": {
                "type": "Literal",
                "value": "unscopables",
                "raw": "\"unscopables\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Symbol.iterator",
              "raw": "\"Symbol.iterator\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Symbol"
              },
              "property": {
                "type": "Literal",
                "value": "iterator",
                "raw": "\"iterator\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Function.prototype.arguments@get",
              "raw": "\"Function.prototype.arguments@get\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "CallExpression",
                "callee": {
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "Reflect"
                  },
                  "property": {
                    "type": "Identifier",
                    "name": "getOwnPropertyDescriptor"
                  },
                  "computed": false,
                  "optional": false
                },
                "arguments": [{
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "Function"
                  },
                  "property": {
                    "type": "Literal",
                    "value": "prototype",
                    "raw": "\"prototype\""
                  },
                  "computed": true,
                  "optional": false
                }, {
                  "type": "Literal",
                  "value": "arguments",
                  "raw": "\"arguments\""
                }],
                "optional": false
              },
              "property": {
                "type": "Identifier",
                "name": "get"
              },
              "computed": false,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Function.prototype.arguments@set",
              "raw": "\"Function.prototype.arguments@set\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "CallExpression",
                "callee": {
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "Reflect"
                  },
                  "property": {
                    "type": "Identifier",
                    "name": "getOwnPropertyDescriptor"
                  },
                  "computed": false,
                  "optional": false
                },
                "arguments": [{
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "Function"
                  },
                  "property": {
                    "type": "Literal",
                    "value": "prototype",
                    "raw": "\"prototype\""
                  },
                  "computed": true,
                  "optional": false
                }, {
                  "type": "Literal",
                  "value": "arguments",
                  "raw": "\"arguments\""
                }],
                "optional": false
              },
              "property": {
                "type": "Identifier",
                "name": "set"
              },
              "computed": false,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.prototype.values",
              "raw": "\"Array.prototype.values\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "Array"
                },
                "property": {
                  "type": "Literal",
                  "value": "prototype",
                  "raw": "\"prototype\""
                },
                "computed": true,
                "optional": false
              },
              "property": {
                "type": "Literal",
                "value": "values",
                "raw": "\"values\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.prototype",
              "raw": "\"Object.prototype\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "prototype",
                "raw": "\"prototype\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.from",
              "raw": "\"Array.from\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Array"
              },
              "property": {
                "type": "Literal",
                "value": "from",
                "raw": "\"from\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.create",
              "raw": "\"Object.create\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "create",
                "raw": "\"create\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.of",
              "raw": "\"Array.of\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Array"
              },
              "property": {
                "type": "Literal",
                "value": "of",
                "raw": "\"of\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Proxy",
              "raw": "\"Proxy\""
            },
            "value": {
              "type": "Identifier",
              "name": "Proxy"
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "RegExp",
              "raw": "\"RegExp\""
            },
            "value": {
              "type": "Identifier",
              "name": "RegExp"
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "TypeError",
              "raw": "\"TypeError\""
            },
            "value": {
              "type": "Identifier",
              "name": "TypeError"
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "ReferenceError",
              "raw": "\"ReferenceError\""
            },
            "value": {
              "type": "Identifier",
              "name": "ReferenceError"
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.get",
              "raw": "\"Reflect.get\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "get",
                "raw": "\"get\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.has",
              "raw": "\"Reflect.has\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "has",
                "raw": "\"has\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.construct",
              "raw": "\"Reflect.construct\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "construct",
                "raw": "\"construct\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.apply",
              "raw": "\"Reflect.apply\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "apply",
                "raw": "\"apply\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.getPrototypeOf",
              "raw": "\"Reflect.getPrototypeOf\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "getPrototypeOf",
                "raw": "\"getPrototypeOf\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.ownKeys",
              "raw": "\"Reflect.ownKeys\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "ownKeys",
                "raw": "\"ownKeys\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.isExtensible",
              "raw": "\"Reflect.isExtensible\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "isExtensible",
                "raw": "\"isExtensible\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.keys",
              "raw": "\"Object.keys\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "keys",
                "raw": "\"keys\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.prototype.concat",
              "raw": "\"Array.prototype.concat\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "Array"
                },
                "property": {
                  "type": "Literal",
                  "value": "prototype",
                  "raw": "\"prototype\""
                },
                "computed": true,
                "optional": false
              },
              "property": {
                "type": "Literal",
                "value": "concat",
                "raw": "\"concat\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.prototype.includes",
              "raw": "\"Array.prototype.includes\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "Array"
                },
                "property": {
                  "type": "Literal",
                  "value": "prototype",
                  "raw": "\"prototype\""
                },
                "computed": true,
                "optional": false
              },
              "property": {
                "type": "Literal",
                "value": "includes",
                "raw": "\"includes\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.prototype.slice",
              "raw": "\"Array.prototype.slice\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "Array"
                },
                "property": {
                  "type": "Literal",
                  "value": "prototype",
                  "raw": "\"prototype\""
                },
                "computed": true,
                "optional": false
              },
              "property": {
                "type": "Literal",
                "value": "slice",
                "raw": "\"slice\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.set",
              "raw": "\"Reflect.set\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "set",
                "raw": "\"set\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.deleteProperty",
              "raw": "\"Reflect.deleteProperty\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "deleteProperty",
                "raw": "\"deleteProperty\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.setPrototypeOf",
              "raw": "\"Reflect.setPrototypeOf\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "setPrototypeOf",
                "raw": "\"setPrototypeOf\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.getOwnPropertyDescriptor",
              "raw": "\"Reflect.getOwnPropertyDescriptor\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "getOwnPropertyDescriptor",
                "raw": "\"getOwnPropertyDescriptor\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Reflect.preventExtensions",
              "raw": "\"Reflect.preventExtensions\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Reflect"
              },
              "property": {
                "type": "Literal",
                "value": "preventExtensions",
                "raw": "\"preventExtensions\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.assign",
              "raw": "\"Object.assign\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "assign",
                "raw": "\"assign\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.freeze",
              "raw": "\"Object.freeze\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "freeze",
                "raw": "\"freeze\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.defineProperty",
              "raw": "\"Object.defineProperty\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "defineProperty",
                "raw": "\"defineProperty\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.setPrototypeOf",
              "raw": "\"Object.setPrototypeOf\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "setPrototypeOf",
                "raw": "\"setPrototypeOf\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Object.preventExtensions",
              "raw": "\"Object.preventExtensions\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "Object"
              },
              "property": {
                "type": "Literal",
                "value": "preventExtensions",
                "raw": "\"preventExtensions\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.prototype.fill",
              "raw": "\"Array.prototype.fill\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "Array"
                },
                "property": {
                  "type": "Literal",
                  "value": "prototype",
                  "raw": "\"prototype\""
                },
                "computed": true,
                "optional": false
              },
              "property": {
                "type": "Literal",
                "value": "fill",
                "raw": "\"fill\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }, {
            "type": "Property",
            "method": false,
            "shorthand": false,
            "computed": true,
            "key": {
              "type": "Literal",
              "value": "Array.prototype.push",
              "raw": "\"Array.prototype.push\""
            },
            "value": {
              "type": "MemberExpression",
              "object": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "Array"
                },
                "property": {
                  "type": "Literal",
                  "value": "prototype",
                  "raw": "\"prototype\""
                },
                "computed": true,
                "optional": false
              },
              "property": {
                "type": "Literal",
                "value": "push",
                "raw": "\"push\""
              },
              "computed": true,
              "optional": false
            },
            "kind": "init"
          }]
        }
      }],
      "sourceType": "script"
    }
  }
});
global_Reflect_defineProperty(prototype, "unary", {
  __proto__: null,
  configurable: true,
  value: {
    __proto__: null,
    operators: ["-", "+", "!", "~", "typeof", "void", "delete"],
    closure: (operator, argument) => {
      switch (operator) {
        case "-":
          return -argument;
        case "+":
          return +argument;
        case "!":
          return !argument;
        case "~":
          return ~argument;
        case "typeof":
          return typeof argument;
        case "void":
          return void argument;
        case "delete":
          return true;
      }
      throw "invalid unary operator";
    },
    script: "\n  ((operator, argument) => {\n    switch (operator) {\n          case \"-\": return - argument;\n    case \"+\": return + argument;\n    case \"!\": return ! argument;\n    case \"~\": return ~ argument;\n    case \"typeof\": return typeof argument;\n    case \"void\": return void argument;\n    case \"delete\": return true;}\n    throw \"invalid unary operator\";});",
    estree: {
      "type": "Program",
      "body": [{
        "type": "ExpressionStatement",
        "expression": {
          "type": "ArrowFunctionExpression",
          "id": null,
          "expression": false,
          "generator": false,
          "async": false,
          "params": [{
            "type": "Identifier",
            "name": "operator"
          }, {
            "type": "Identifier",
            "name": "argument"
          }],
          "body": {
            "type": "BlockStatement",
            "body": [{
              "type": "SwitchStatement",
              "discriminant": {
                "type": "Identifier",
                "name": "operator"
              },
              "cases": [{
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "UnaryExpression",
                    "operator": "-",
                    "prefix": true,
                    "argument": {
                      "type": "Identifier",
                      "name": "argument"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "-",
                  "raw": "\"-\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "UnaryExpression",
                    "operator": "+",
                    "prefix": true,
                    "argument": {
                      "type": "Identifier",
                      "name": "argument"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "+",
                  "raw": "\"+\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "UnaryExpression",
                    "operator": "!",
                    "prefix": true,
                    "argument": {
                      "type": "Identifier",
                      "name": "argument"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "!",
                  "raw": "\"!\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "UnaryExpression",
                    "operator": "~",
                    "prefix": true,
                    "argument": {
                      "type": "Identifier",
                      "name": "argument"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "~",
                  "raw": "\"~\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "UnaryExpression",
                    "operator": "typeof",
                    "prefix": true,
                    "argument": {
                      "type": "Identifier",
                      "name": "argument"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "typeof",
                  "raw": "\"typeof\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "UnaryExpression",
                    "operator": "void",
                    "prefix": true,
                    "argument": {
                      "type": "Identifier",
                      "name": "argument"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "void",
                  "raw": "\"void\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "Literal",
                    "value": true,
                    "raw": "true"
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "delete",
                  "raw": "\"delete\""
                }
              }]
            }, {
              "type": "ThrowStatement",
              "argument": {
                "type": "Literal",
                "value": "invalid unary operator",
                "raw": "\"invalid unary operator\""
              }
            }]
          }
        }
      }],
      "sourceType": "script"
    }
  }
});
global_Reflect_defineProperty(prototype, "binary", {
  __proto__: null,
  configurable: true,
  value: {
    __proto__: null,
    operators: ["==", "!=", "===", "!==", "<", "<=", ">", ">=", "<<", ">>", ">>>", "+", "-", "*", "/", "%", "|", "^", "&", "in", "instanceof"],
    closure: (operator, argument1, argument2) => {
      switch (operator) {
        case "==":
          return argument1 == argument2;
        case "!=":
          return argument1 != argument2;
        case "===":
          return argument1 === argument2;
        case "!==":
          return argument1 !== argument2;
        case "<":
          return argument1 < argument2;
        case "<=":
          return argument1 <= argument2;
        case ">":
          return argument1 > argument2;
        case ">=":
          return argument1 >= argument2;
        case "<<":
          return argument1 << argument2;
        case ">>":
          return argument1 >> argument2;
        case ">>>":
          return argument1 >>> argument2;
        case "+":
          return argument1 + argument2;
        case "-":
          return argument1 - argument2;
        case "*":
          return argument1 * argument2;
        case "/":
          return argument1 / argument2;
        case "%":
          return argument1 % argument2;
        case "|":
          return argument1 | argument2;
        case "^":
          return argument1 ^ argument2;
        case "&":
          return argument1 & argument2;
        case "in":
          return (argument1 in argument2);
        case "instanceof":
          return argument1 instanceof argument2;
      }
      throw "invalid binary operator";
    },
    script: "\n  ((operator, argument1, argument2) => {\n    switch (operator) {\n            case \"==\": return argument1 == argument2;\n      case \"!=\": return argument1 != argument2;\n      case \"===\": return argument1 === argument2;\n      case \"!==\": return argument1 !== argument2;\n      case \"<\": return argument1 < argument2;\n      case \"<=\": return argument1 <= argument2;\n      case \">\": return argument1 > argument2;\n      case \">=\": return argument1 >= argument2;\n      case \"<<\": return argument1 << argument2;\n      case \">>\": return argument1 >> argument2;\n      case \">>>\": return argument1 >>> argument2;\n      case \"+\": return argument1 + argument2;\n      case \"-\": return argument1 - argument2;\n      case \"*\": return argument1 * argument2;\n      case \"/\": return argument1 / argument2;\n      case \"%\": return argument1 % argument2;\n      case \"|\": return argument1 | argument2;\n      case \"^\": return argument1 ^ argument2;\n      case \"&\": return argument1 & argument2;\n      case \"in\": return argument1 in argument2;\n      case \"instanceof\": return argument1 instanceof argument2;}\n    throw \"invalid binary operator\";});",
    estree: {
      "type": "Program",
      "body": [{
        "type": "ExpressionStatement",
        "expression": {
          "type": "ArrowFunctionExpression",
          "id": null,
          "expression": false,
          "generator": false,
          "async": false,
          "params": [{
            "type": "Identifier",
            "name": "operator"
          }, {
            "type": "Identifier",
            "name": "argument1"
          }, {
            "type": "Identifier",
            "name": "argument2"
          }],
          "body": {
            "type": "BlockStatement",
            "body": [{
              "type": "SwitchStatement",
              "discriminant": {
                "type": "Identifier",
                "name": "operator"
              },
              "cases": [{
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "==",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "==",
                  "raw": "\"==\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "!=",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "!=",
                  "raw": "\"!=\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "===",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "===",
                  "raw": "\"===\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "!==",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "!==",
                  "raw": "\"!==\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "<",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "<",
                  "raw": "\"<\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "<=",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "<=",
                  "raw": "\"<=\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": ">",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": ">",
                  "raw": "\">\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": ">=",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": ">=",
                  "raw": "\">=\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "<<",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "<<",
                  "raw": "\"<<\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": ">>",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": ">>",
                  "raw": "\">>\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": ">>>",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": ">>>",
                  "raw": "\">>>\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "+",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "+",
                  "raw": "\"+\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "-",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "-",
                  "raw": "\"-\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "*",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "*",
                  "raw": "\"*\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "/",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "/",
                  "raw": "\"/\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "%",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "%",
                  "raw": "\"%\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "|",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "|",
                  "raw": "\"|\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "^",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "^",
                  "raw": "\"^\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "&",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "&",
                  "raw": "\"&\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "in",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "in",
                  "raw": "\"in\""
                }
              }, {
                "type": "SwitchCase",
                "consequent": [{
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "BinaryExpression",
                    "left": {
                      "type": "Identifier",
                      "name": "argument1"
                    },
                    "operator": "instanceof",
                    "right": {
                      "type": "Identifier",
                      "name": "argument2"
                    }
                  }
                }],
                "test": {
                  "type": "Literal",
                  "value": "instanceof",
                  "raw": "\"instanceof\""
                }
              }]
            }, {
              "type": "ThrowStatement",
              "argument": {
                "type": "Literal",
                "value": "invalid binary operator",
                "raw": "\"invalid binary operator\""
              }
            }]
          }
        }
      }],
      "sourceType": "script"
    }
  }
});
global_Reflect_defineProperty(prototype, "object", {
  __proto__: null,
  configurable: true,
  value: {
    __proto__: null,
    closure: (prototype, entries) => {
      const object = {
        __proto__: null
      };
      for (let index = 0; index < entries.length; index++) {
        object[entries[index][0]] = entries[index][1];
      }
      return prototype === null ? object : Object.assign({
        __proto__: prototype
      }, object);
    },
    script: "\n  ((prototype, entries) => {\n    const object = {__proto__: null};\n    for (let index = 0; index < entries.length; index ++) {\n      object[entries[index][0]] = entries[index][1];}\n    return prototype === null ? object : Object.assign({__proto__:prototype}, object);});",
    estree: {
      "type": "Program",
      "body": [{
        "type": "ExpressionStatement",
        "expression": {
          "type": "ArrowFunctionExpression",
          "id": null,
          "expression": false,
          "generator": false,
          "async": false,
          "params": [{
            "type": "Identifier",
            "name": "prototype"
          }, {
            "type": "Identifier",
            "name": "entries"
          }],
          "body": {
            "type": "BlockStatement",
            "body": [{
              "type": "VariableDeclaration",
              "declarations": [{
                "type": "VariableDeclarator",
                "id": {
                  "type": "Identifier",
                  "name": "object"
                },
                "init": {
                  "type": "ObjectExpression",
                  "properties": [{
                    "type": "Property",
                    "method": false,
                    "shorthand": false,
                    "computed": false,
                    "key": {
                      "type": "Identifier",
                      "name": "__proto__"
                    },
                    "value": {
                      "type": "Literal",
                      "value": null,
                      "raw": "null"
                    },
                    "kind": "init"
                  }]
                }
              }],
              "kind": "const"
            }, {
              "type": "ForStatement",
              "init": {
                "type": "VariableDeclaration",
                "declarations": [{
                  "type": "VariableDeclarator",
                  "id": {
                    "type": "Identifier",
                    "name": "index"
                  },
                  "init": {
                    "type": "Literal",
                    "value": 0,
                    "raw": "0"
                  }
                }],
                "kind": "let"
              },
              "test": {
                "type": "BinaryExpression",
                "left": {
                  "type": "Identifier",
                  "name": "index"
                },
                "operator": "<",
                "right": {
                  "type": "MemberExpression",
                  "object": {
                    "type": "Identifier",
                    "name": "entries"
                  },
                  "property": {
                    "type": "Identifier",
                    "name": "length"
                  },
                  "computed": false,
                  "optional": false
                }
              },
              "update": {
                "type": "UpdateExpression",
                "operator": "++",
                "prefix": false,
                "argument": {
                  "type": "Identifier",
                  "name": "index"
                }
              },
              "body": {
                "type": "BlockStatement",
                "body": [{
                  "type": "ExpressionStatement",
                  "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "Identifier",
                        "name": "object"
                      },
                      "property": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "MemberExpression",
                          "object": {
                            "type": "Identifier",
                            "name": "entries"
                          },
                          "property": {
                            "type": "Identifier",
                            "name": "index"
                          },
                          "computed": true,
                          "optional": false
                        },
                        "property": {
                          "type": "Literal",
                          "value": 0,
                          "raw": "0"
                        },
                        "computed": true,
                        "optional": false
                      },
                      "computed": true,
                      "optional": false
                    },
                    "right": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "entries"
                        },
                        "property": {
                          "type": "Identifier",
                          "name": "index"
                        },
                        "computed": true,
                        "optional": false
                      },
                      "property": {
                        "type": "Literal",
                        "value": 1,
                        "raw": "1"
                      },
                      "computed": true,
                      "optional": false
                    }
                  }
                }]
              }
            }, {
              "type": "ReturnStatement",
              "argument": {
                "type": "ConditionalExpression",
                "test": {
                  "type": "BinaryExpression",
                  "left": {
                    "type": "Identifier",
                    "name": "prototype"
                  },
                  "operator": "===",
                  "right": {
                    "type": "Literal",
                    "value": null,
                    "raw": "null"
                  }
                },
                "consequent": {
                  "type": "Identifier",
                  "name": "object"
                },
                "alternate": {
                  "type": "CallExpression",
                  "callee": {
                    "type": "MemberExpression",
                    "object": {
                      "type": "Identifier",
                      "name": "Object"
                    },
                    "property": {
                      "type": "Identifier",
                      "name": "assign"
                    },
                    "computed": false,
                    "optional": false
                  },
                  "arguments": [{
                    "type": "ObjectExpression",
                    "properties": [{
                      "type": "Property",
                      "method": false,
                      "shorthand": false,
                      "computed": false,
                      "key": {
                        "type": "Identifier",
                        "name": "__proto__"
                      },
                      "value": {
                        "type": "Identifier",
                        "name": "prototype"
                      },
                      "kind": "init"
                    }]
                  }, {
                    "type": "Identifier",
                    "name": "object"
                  }],
                  "optional": false
                }
              }
            }]
          }
        }
      }],
      "sourceType": "script"
    }
  }
});
const signal = message => {
  throw new global_Error(message);
};
global_Reflect_defineProperty(prototype, "weave", {
  __proto__: null,
  configurable: true,
  value: function weave(estree, pointcut, serial, _nullable_scope, _serials, _closure) {
    return (_nullable_scope = typeof serial === "number" ? serial !== serial ? signal("serial is NaN") : global_Math_round(serial) !== serial ? signal("serial should be an integer") : serial < 0 ? signal("serial should be a positive integer") : !global_Reflect_getOwnPropertyDescriptor(this.scopes, serial) ? signal("serial does not refer to a node representing a direct eval call") : this.scopes[serial] : serial === null || serial === void 0 ? null : signal("serial should either be null/undefined (global code) or a number (direct eval code)"), pointcut = global_Array_isArray(pointcut) ? ArrayLite.reduce(pointcut, (object, name) => (object[name] = true, object), {
      __proto__: null
    }) : typeof pointcut === "function" ? (_closure = pointcut, ArrayLite.reduce(trap_name_array, (object, name) => (object[name] = (...args) => _closure(name, args), object), {
      __proto__: null
    })) : pointcut === false ? {
      __proto__: null
    } : pointcut === true ? ArrayLite.reduce(trap_name_array, (object, name) => (object[name] = true, object), {
      __proto__: null
    }) : typeof pointcut === "object" && pointcut !== null ? pointcut : signal("pointcut must be either an array, a closure, a boolean, or an object"), _serials = new global_Map(), Generate(Instrument(Normalize(_nullable_scope, estree, {
      __proto__: null,
      nodes: this.nodes,
      scopes: this.scopes,
      serials: _serials
    }), {
      __proto__: null,
      local: _nullable_scope !== null,
      show: show,
      serials: _serials,
      pointcut: pointcut,
      namespace: make_instrument_namespace()
    }), {
      __proto__: null,
      local: _nullable_scope !== null,
      convert: convert,
      apply: apply,
      construct: construct,
      namespace: make_generate_namespace()
    }));
  }
});
module.exports = function Aran(json) {
  return {
    __proto__: prototype,
    scopes: json ? json.scopes : {},
    nodes: json ? json.nodes : []
  };
};
