
const ArrayLite = require("array-lite");
const Enumeration = require("./enumeration.js");

const Reflect_apply = Reflect.apply;
const String_prototype_split = String.prototype.split;

const primordials = Enumeration.Primordial;

exports.script = (namespace) => (
  `if (${namespace}.primordials) throw new this.Error("Setup has already been done");\n` +
  `${namespace}.primordials = this.Object.create(null);\n` +
  `${namespace}.primordials.global = this;` +
  ArrayLite.join(
    ArrayLite.map(
      ArrayLite.filter(
        primordials,
        (primordial) => primordial !== "global"),
      (name) => `${namespace}.primordials["${name}"] = this.${name};\n`),
    ""));

const set = (namespace, name, expression) => ({
  type: "ExpressionStatement",
  expression: {
    type: "AssignmentExpression",
    operator: "=",
    left: {
      type: "MemberExpression",
      computed: true,
      object: {
        type: "MemberExpression",
        computed: false,
        object: {
          type: "Identifier",
          name: namespace},
        property: {
          type: "Identifier",
          name: "primordials"}},
      property: {
        type: "Literal",
        value: name}},
    right: expression}});

exports.estree = (namespace) => ({
  type: "Program",
  body: ArrayLite.concat(
    [
      {
        type: "IfStatement",
        test: {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "Identifier",
            name: namespace},
          property: {
            type: "Identifier",
            name: "primordials"}},
        consequent: {
          type: "ThrowStatement",
          argument: {
            type: "NewExpression",
            callee: {
              type: "MemberExpression",
              computed: false,
              object: {
                type: "ThisExpression"},
              property: {
                type: "Identifier",
                name: "Error"}},
            arguments: [
              {
                type: "Literal",
                value: "Setup has already been done"}]}},
        alternate: null},
      {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "MemberExpression",
            computed: false,
            object: {
              type: "Identifier",
              name: namespace},
            property: {
              type: "Identifier",
              name: "primordials"}},
          right: {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              computed: false,
              object: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "ThisExpression"},
                property: {
                  type: "Identifier",
                  name: "Object"}},
              property: {
                type: "Identifier",
                name: "create"}},
            arguments: [
              {
                type: "Literal",
                value: null}]}}},
      set(namespace, "global", {type: "ThisExpression"})],
    ArrayLite.map(
      ArrayLite.filter(
        primordials,
        (primordial) => (
          primordial !== "global" &&
          primordial !== "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get" &&
          primordial !== "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")),
      (primordial) => set(
        namespace,
        primordial,
        ArrayLite.reduce(
          Reflect_apply(String_prototype_split, primordial, ["."]),
          (expression, identifier) => ({
            type: "MemberExpression",
            computed: false,
            object: expression,
            property: {
              type: "Identifier",
              name: identifier}}),
          {
            type: "ThisExpression"}))),
    ArrayLite.map(
      ["get", "set"],
      (string) => set(
        namespace,
        "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments')." + string,
        {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              computed: false,
              object: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "ThisExpression"},
                property: {
                  type: "Identifier",
                  name: "Object"}},
              property: {
                type: "Identifier",
                name: "getOwnPropertyDescriptor"}},
            arguments: [
              {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "MemberExpression",
                  computed: false,
                  object: {
                    type: "ThisExpression"},
                  property: {
                    type: "Identifier",
                    name: "Function"}},
                property: {
                  type: "Identifier",
                  name: "prototype"}},
              {
                type: "Literal",
                value: "arguments"}]},
          property: {
            type: "Identifier",
            name: string}})))});
