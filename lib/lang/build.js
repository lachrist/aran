"use strict";

// type Field = *
// type Expression = (ExpressionConstructor, [Field])
// type Statement = (StatementConstructor, [Field])
// type Block = (BlockConstructor, [Field])

const ArrayLite = require("array-lite");
const Syntax = require("./syntax.js");

const global_Proxy = global.Proxy;
const global_Error = global.Error;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Array_isArray = global.Array.isArray;
const global_Object_setPrototypeOf = global.Object.setPrototypeOf;
const global_WeakSet = global.WeakSet;
const global_WeakSet_prototype_add = global.WeakSet.prototype.add;
const global_WeakSet_prototype_has = global.WeakSet.prototype.has;

/////////////////
// Normal Mode //
/////////////////

exports._switch_normal_mode = () => {

  ArrayLite.forEach(Syntax._get_statement_constructor_array(), (statement_constructor) => {
    if (Syntax.statement[constructor].length === 0) {
      exports[constructor] = () => [[constructor]];
    } else if (Syntax.statement[constructor].length === 1) {
      exports[constructor] = (field1) => [[constructor, field1]];
    } else if (Syntax.statement[constructor].length === 2) {
      exports[constructor] = (field1, field2) => [[constructor, field1, field2]];
    } else if (Syntax.statement[constructor].length === 3) {
      exports[constructor] = (field1, field2, field3) => [[constructor, field1, field2, field3]];
    } else {
      // console.assert(Syntax.statement[constructor].length === 4);
      exports[constructor] = (field1, field2, field3, field4) => [[constructor, field1, field2, field3, field4]];
    }
  });
  
  ArrayLite.forEach(global_Reflect_ownKeys(Syntax.expression), (constructor) => {
    if (Syntax.expression[constructor].length === 1) {
      exports[constructor] = (field1) => [constructor, field1];
    } else if (Syntax.expression[constructor].length === 2) {
      exports[constructor] = (field1, field2) => [constructor, field1, field2];
    } else {
      // console.assert(Syntax.expression[constructor].length === 3);
      exports[constructor] = (field1, field2, field3) => [constructor, field1, field2, field3];
    }
  });
  
  exports.BLOCK = (field1, field2) => ["BLOCK", field1, field2];

};

exports._switch_normal_mode();

////////////////
// Debug Mode //
////////////////

exports._switch_debug_mode = () => {

  const weakset_prototype = {
    __proto__: null,
    add: global_WeakSet_prototype_add,
    has: global_WeakSet_prototype_has
  };

  const database = {
    __proto__: null,
    expression: global_Object_setPrototypeOf(new global_WeakSet(), weakset_prototype),
    statement: global_Object_setPrototypeOf(new global_WeakSet(), weakset_prototype),
    block: global_Object_setPrototypeOf(new global_WeakSet(), weakset_prototype)
  };

  const traps = {
    __proto__: null,
    setPrototypeOf: (target, prototype) => {
      throw new global_Error("setPrototypeOf on immutable node");
    },
    defineProperty: (target, key, descriptor) => {
      throw new global_Error("defineProperty on immutable node");
    }
  };

  const check = (type, node) => {
    if (typeof type === "string") {
      if (type === "identifier" || type === "label" || type === "primitive") {
        if (!Syntax[type](node)) {
          throw new global_Error("Invalid node of predicate-based type");
        }
      } else if (type === "builtin-name" || type === "unary-operator" || type === "binary-operator") {
        if (!ArrayLite.includes(Syntax[type], node)) {
          throw new global_Error("Invalid node of enumeration-based type");
        }
      } else {
        // console.assert(type === "statement" || type === "expression" || type === "lone-block" || type === "then-block" || ...);
        if (type !== "statement" && type !== "expression") {
          type = "block";
        }
        if (!database[type].has(node)) {
          throw new global_Error("Invalid node of identity-based type");
        }
      }
      return node;
    }
    // console.assert(global_Array_isArray(type));
    if (!global_Array_isArray(node)) {
      throw new global_Error("Expected array node");
    }
    if (type.length === 1) {
      return new global_Proxy(ArrayLite.map(node, (node) => check(type[0], node)), traps);
    }
    if (type.length !== node.length) {
      throw new global_Error("Length mismatch in array node");
    }
    return new global_Proxy(ArrayLite.map(node, (node, index) => check(type[index], node)), traps);
  };

  ArrayLite.forEach(["statement", "expression", "block"], (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(Syntax[type]), (constructor) => {
      exports[constructor] = (...fields) => {
        if (fields.length !== Syntax[type][constructor].length) {
          throw new global_Error("Wrong number of fields");
        }
        fields = ArrayLite.map(fields, (field, index) => check(Syntax[type][constructor][index], field));
        const node = new global_Proxy(ArrayLite.concat([constructor], fields), traps);
        database[type].add(node);
        return type === "statement" ? [node] : node;
      };
    });
  });

};
