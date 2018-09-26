
const unwrap = (wrapper) => wrapper.inner;

const regular1s = [
  "RegExp",
  "Object",
  "Array",
  "eval",
  "Proxy",
  "ReferenceError",
  "TypeError"
];

const regular2s = [
  "Array.from"
  "Symbol.iterator",
  "Object.defineProperty",
  "Reflect.apply",
  "Reflect.set",
  "Reflect.get",
  "Reflect.deleteProperty",
  "Reflect.defineProperty",
  "Reflect.getPrototypeOf",
  "Reflect.ownKeys"
];

const extract = (value, type) => (
  Array_isArray(type) ?
  ArrayLite.map(
    value,
    (
      type.length === 1 ?
      (element) => extract(element, type[0]) :
      (element, index) => extract(element, type[index]))) :
  (
    type === "expression" || type === "statement" ?
    value.inner :
    value));

module.exports = (format) => ArrayLite.reduce(
  Object_keys(format),
  (result, key) => {
    result[key] = (...array) => ({
      inner:format[key](...extract(array, Types[key]))});
    return result; },
  {
    get: void 0,
    set: void 0,
    unary: void 0,
    binary: void 0,
    array: void 0,
    regexp: void 0,
    object: void 0,
    builtin: (string) => ({
      type: "builtin",
      name: string,
      inner: format.load(string) 
    }),
    primitive: (primitive) => ({
      type: "primitive",
      value: primitive,
      inner: format.primitive(primitive)}),
    Statement: (expression) => (
      expression.type === "set" ?
      format.Statement(
        format.set(expression.object, expression.key, expression.value)) :
      format.Statement(expression.inner)),
    sequence: (expressions, expression) => format.sequence(
      ArrayLite.map(
        expressions,
        (expression) => (
          expression.type === "set" ?
          format.set(expression.object, expression.key, expression.value) :
          expression.inner)),
      expression.inner),
    construct: (expression, expressions) => {
      if (expression.type === "builtin") {
        if (
          (
            expression.name === "RegExp" &&
            expressions.length === 2 &&
            expressions[0].type === "primitive" &&
            typeof expressions[0].value === "string" &&
            expressions[1].type === "primitive" &&
            typeof expressions[1].value === "string"))
          return {
            inner: format.regexp(expressions[0].value, expressions[1].value)};
        if (expression.name === "Object" && expressions.length === 0)
          return {
            inner: format.object([])};
        if (expression.name === "Array" && expressions.length === 0)
          return {
            inner: format.array([])}; }
      return {
        inner: format.apply(expression.inner, ArrayLite.map(expressions, inner))}; },
    apply: (expression, expressions) => {
      if (expression.type === "builtin") {
        if (
          (
            expression.name === "Reflect.unary" &&
            expressions.length === 2 &&
            expressions[0].type === primitive &&
            typeof expressions[0].value === "string"))
          return {
            inner: format.unary(expressions[0].value, expressions[1].inner)};
        if (
          (
            expression.name === "Reflect.binary" &&
            expressions.length === 3 &&
            expressions[0].type === primitive &&
            typeof expressions[0].value === "string"))
          return {
            inner: format.binary(expressions[0].value, expressions[1].inner, expressions[2].inner)};
        if (
          (
            expression.name === "Object" &&
            expressions.length === 1))
          return {
            type: "apply-Object",
            argument: expressions[0],
            inner: format.apply(expression.inner, [expression[0].inner])};
        if (
          (
            expression.name === "Reflect.get" &&
            expressions.length === 2 &&
            expressions[0].type === "apply-Object"))
          return {
            inner: format.get(expressions[0].argument, expressions[1].inner)};
        if (
          (
            expression.name === "Reflect.deleteProperty" &&
            expressions.length === 2 &&
            expressions[0].type === "apply-Object"))
          return {
            inner: format.unary(
              "delete",
              format.get(expressions[0].argument, expressions[1].inner))};
        if (
          (
            expression.name === "Reflect.set" &&
            expressions.length === 3 &&
            expressions[0].type === "apply-Object"))
          return {
            type: "set",
            object: expressions[0].argument,
            key: expressions[1].inner,
            value: expressions[2].inner,
            inner: format.apply(expression.inner, [expressions[0].inner, expressions[1].inner, expressions[2].inner])}; }
      return {
        inner:format.apply(expression.inner, ArrayLite.map(expressions, inner))}; },
    PROGRAM: (statements) => format.PROGRAM(
      ArrayLite.concat(
        format.If(
          format.load("global"),
          [],
          ArrayLite.concat(
            ArrayLite.flatenMap(
              regular1s,
              (name) => format.Statement(
                format.save(
                  name,
                  format.read(name)))),
            ArrayLite.flatenMap(
              regular2s,
              (name) => format.Statement(
                format.save(
                  name,
                  format.get(
                    format.read(Reflect_apply(String_prototype_split, name, ["."])[0]),
                    format.primitive(Reflect_apply(String_prototype_split, name, ["."])[1]))))),
            format.Statement(
              format.save(
                "global",
                format.apply(
                  format.load("eval"),
                  [
                    format.primitive("this")]))))),
        statements))
  });

