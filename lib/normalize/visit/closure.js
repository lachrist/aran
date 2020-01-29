
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const global_Array_from = global.Array.from;

// https://tc39.github.io/ecma262/#sec-function-instances

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; } 
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

// const NONE = 1;
// const CALLEE = 2;
// const NEW_TARGET = 3;
// const THIS = 5;
// const ARGUMENTS = 7;

// NICE TO HAVE: scope analysis to avoid generating arguments.
// const freeof = (nodes, identifier) => {
//   nodes = global_Array_from(nodes);
//   let length = nodes.length;
//   const union = NONE;
//   while (length > 0) {
//     const node = nodes[--length];
//     if ("type" in node) {
//       if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
//         continue;
//       }
//       if (node.type === "MetaProperty") {
//         if (union % NEW_TARGET === 0) {
//           union = union * NEW_TARGET;
//         }
//       } else if (node.type === "ThisExpression") {
//         if (union % THIS === 0) {
//           union = union * THIS;
//         }
//       } else if (node.type === "Identifier") {
//         if (node.name === "arguments") {
//           if (union % ARGUMENTS === 0) {
//             union = union * ARGUMENTS;
//           }
//         } else if (node.name === identifier) {
//           if (union % CALLEE === 0) {
//             union = union * CALLEE;
//           }
//         }
//       }
//       if (isdirecteval(node)) {
//         return CALLEE * NEW_TARGET * THIS * ARGUMENTS;
//       }
//     }
//     for (let key in node) {
//       if (typeof node[key] === "object" && node[key] !== null) {
//         nodes[length++] = node[key];
//       }
//     }
//   }
//   return object;
// };

// const isdirecteval = (node) => (
//   node.type === "CallExpression" &&
//   node.callee.type === "Identifier" &&
//   node.callee.name === "eval" &&
//   node.arguments.length > 0 &&
//   ArrayLite.every(
//     node.arguments,
//     (argument) => argument.type !== "SpreadElement"));

const variables = (nodes, kind) => {
  if (kind !== "var") {
    return ArrayLite.flatMap(
      nodes,
      (node) => (
        (
          node.type === "VariableDeclaration" &&
          node.kind === kind) ?
        ArrayLite.flatMap(node.declarations, declaration) :
        []));
  }
  nodes = global_Reflect_apply(global_Array_prototype_slice, nodes, []);
  let length = nodes.length;
  const identifiers = [];
  while (length) {
    const node = nodes[--length];
    if (node.type === "IfStatement") {
      nodes[length++] = node.consequent;
      if (node.alternate) {
        nodes[length++] = node.alternate;
      }
    } else if (node.type === "LabeledStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "ForStatement") {
      nodes[length++] = node.body;
      if (node.init && node.init.type === "VariableDeclaration") {
        nodes[length++] = node.init;
      }
    } else if (node.type === "ForOfStatement" || node.type === "ForInStatement") {
      nodes[length++] = node.body;
      if (node.left.type === "VariableDeclaration") {
        nodes[length++] = node.left;
      }
    } else if (node.type === "BlockStatement") {
      for (let index = node.body.length - 1; index >= 0; index--) {
        nodes[length++] = node.body[index];
      }
    } else if (node.type === "TryStatement") {
      nodes[length++] = node.block;
      if (node.handler) {
        nodes[length++] = node.handler.body;
      }
      if (node.finalizer) {
        nodes[length++] = node.finalizer;
      }
    } else if (node.type === "SwitchCase") {
      for (let index = node.consequent.length - 1; index >= 0; index--) {
        nodes[length++] = node.consequent[index];
      }
    } else if (node.type === "SwitchStatement") {
      for (let index = node.cases.length - 1; index >= 0; index--) {
        nodes[length++] = node.cases[index];
      }
    } else if (node.type === "VariableDeclaration") {
      if (node.kind === "var") {
        ArrayLite.forEach(ArrayLite.flatMap(node.declarations, dids), (identifier) => {
          if (!ArrayLite.includes(identifiers, identifier)) {
            identifiers[identifiers.length] = identifier;
          }
        });
      }
    } else if (node.type === "FunctionDeclaration") {
      if (!ArrayLite.includes(identifiers, node.id.name)) {
        identifiers[identifiers.length] = node.id.name;
      }
    }
  }
  return identifiers;
};

const extract = (node, closure) => {
  const labels = [];
  let nodes = [node];
  while (nodes.length === 1) {
    if (nodes[0].type === "LabeledStatement") {
      labels[labels.length] = nodes[0].label.name];
      nodes = [nodes[0].body];
    } else if (node.type === "BlockStatement" || node.type === "Program") {
      nodes = ArrayLite.filter(nodes[0].body, (node) => node.type !== "EmptyStatement");
      const nodes1 = ArrayLite.filter(nodes, (node) => node.type === "FunctionDeclaration");
      const nodes2 = ArrayLite.filter(nodes, (node) => node.type !== "FunctionDeclaration");
      nodes = ArrayLite.concat(nodes1, nodes2);
    } else {
      break;
    }
  }
  // We do not have to remove duplicates between vars and lets/consts:
  // =================================================================
  // > function f () { let foo; { var foo; }}
  // Thrown:
  // function f () { let foo; { var foo; }}
  return closure(
    nodes,
    labels,
    variables(nodes, "var"),
    variables(nodes, "let"),
    variables(nodes, "const"));
};

const isstrict = (nodes) => (
  nodes.length > 0 &&
  nodes[0].type === "ExpressionStatement" &&
  nodes[0].expression.type === "Literal" &&
  nodes[0].expression.value === "use strict");

exports.Program = (node, scope) => (
  (
    (scope) => extract(
      node,
      (nodes, labels, identifiers1, identifiers2, identifier3) => Scope.BLOCK(
        scope,
        labels,
        (
          (
            Scope.$IsStrict(scope) ||
            !Scope.$IsGlobal(scope)) ?
          ArrayLite.concat(identifiers1, identifiers2) :
          identifiers2),
        ArrayLite.concat(["this"], identifiers3),
        (scope) => ArrayLite.concat(
          Build.Expression(
            Scope.initialize(
              scope,
              "this",
              Build.builtin("global"))),
          ArrayLite.flatMap(
            identifiers1,
            (
              (
                Scope.$IsStrict(scope) ||
                !Scope.$IsGlobal(scope)) ?
              (identifier) => Build.Expression(
                Scope.initialize(
                  scope,
                  "this",
                  Build.primitive(void 0))) :
              (identifier) => Build.Expression(
                Object.set(
                  false,
                  Build.builtin("global"),
                  Build.primitive(identifier),
                  Build.primitive(void 0))))),
          Scope.Cache(
            scope,
            "ClosureProgramCompletion",
            Build.primitive(void 0),
            (cache) => ArrayLite.concat(
              Lexic.FlatMap(
                Lexic.Create(cache),
                labels,
                [],
                nodes,
                (node, lexic) => Visit.Node(node, scope, lexic, [])),
              Build.Return(
                Scope.get(scope, cache))))))))
  (
    (
      isstrict(node.body) ?
      Scope.$ExtendStrict(scope)) :
      scope)));

exports.ArrowFunctionExpression = (node, scope, boolean, cache) => Build.apply(
  Build.builtin("Object.defineProperty"),
  Build.primitive(void 0),
  [
    Build.apply(
      Build.builtin("Object.defineProperty"),
      Build.primitive(void 0),
      [
        Build.closure(
          Scope.BLOCK(
            Scope.$ExtendArrow(
              (
                isstrict(node.body) ?
                Scope.$ExtendStrict(scope) :
                scope)),
            ArrayLite.flatMap(node.params, Pattern.$Identifiers),
            [],
            (scope) => ArrayLite.concat(
              Build.Expression(
                Build.conditional(
                  Scope.newtarget(scope),
                  Build.throw(
                    Build.construct(
                      Build.builtin("TypeError"),
                      [
                        Build.primitive("arrow is not a constructor")])),
                  Build.primitive(void 0))),
              ArrayLite.flatMap(
                node.params,
                (param, index) => Build.Expression(
                  Pattern.assign1(
                    scope,
                    true,
                    (
                      param.type === "RestElement" ?
                      param.argument :
                      param),
                    (
                      param.type === "RestElement" ?
                      Build.apply(
                        Build.builtin("Array.prototype.slice"),
                        Scope.arguments(scope),
                        [
                          Build.primitive(index)]) :
                      Object.get(
                        Scope.arguments(scope),
                        Build.primitive(index)))))),
              (
                node.expression ?
                Build.Return(
                  Visit.node(node.body, scope, false, null)) :
                ArrayLite.concat(
                  Build.Block(
                    extract(
                      node.body,
                      (nodes, labels, identifiers1, identifiers2, identifiers3) => Scope.BLOCK(
                        scope,
                        labels,
                        ArrayLite.concat(identifiers1, identifiers2),
                        identifiers3,
                        (scope) => ArrayLite.concat(
                          ArrayLite.flatMap(
                            identifiers1,
                            (identifier) => Build.Expression(
                              Scope.initialize(
                                scope,
                                identifier,
                                Build.primitive(void 0)))),
                          Lexic.FlatMap(
                            Lexic.Create(null),
                            labels,
                            [],
                            nodes,
                            (node, lexic) => Visit.Node(node, scope, lexic, [])))))),
                  Build.Return(
                    Build.primitive(void 0))))))),
        Build.primitive("length"),
        Build.object(
          Build.primitive(null),
          [
            [
              Build.primitive("value"),
              Build.primitive(
                (
                  (
                    params.length > 0 &&
                    params[params.length - 1].type === "RestElement") ?
                  params.length - 1 :
                  params.length))],
            [
              Build.primitive("configurable"),
              Build.primitive(true)]])]),
    Build.primitive("name"),
    Build.object(
      Build.primitive(null),
      [
        [
          Build.primitive("value"),
          (
            cache === null ?
            Build.primitive("") :
            Scope.get(scope, cache))],
        [
          Build.primitive("configurable"),
          Build.primitive(true)]])]);

exports.FunctionExpression = (node, scope, boolean, cache) => (
  (
    (expression) => (
      Scope.$GetStrict(scope) ?
      expression :
      Build.apply(
        Build.builtin("Object.defineProperty"),
        Build.primitive(void 0),
        [
          Build.apply(
            Build.builtin("Object.defineProperty"),
            Build.primitive(void 0),
            [
              expression,
              Build.primitive("arguments"),
              Build.object(
                Build.primitive(null),
                [
                  [
                    Build.primitive("value"),
                    Build.primitive(null)]])]),
          Build.primitive("caller"),
          Build.object(
            Build.primitive(null),
            [
              [
                Build.primitive("value"),
                Build.primitive(null)]])])))
  (
    Scope.cache(
      scope,
      "ClosureFunctionResult",
      Build.primitive(null),
      (cache) => Build.sequence(
        Scope.set(
          scope,
          cache,
          Build.apply(
            Build.builtin("Object.defineProperty"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.builtin("Object.defineProperty"),
                Build.primitive(void 0),
                [
                  Build.closure(
                    Scope.BLOCK(
                      Scope.$ExtendFunction(
                        (
                          isstrict(node.body) ?
                          Scope.$ExtendStrict(scope) :
                          scope)),
                      [],
                      (
                        node.id === null ?
                        ["arguments"] :
                        [node.id.name, "arguments"]),
                      ["new.target", "this"],
                      (scope) => ArrayLite.concat(
                        (
                          node.id === null ?
                          [] :
                          Build.Expression(
                            Scope.initialize(
                              scope,
                              node.id.name,
                              Scope.get(scope, cache)))),
                        Build.Expression(
                          Scope.initialize(
                            scope,
                            "new.target",
                            Scope.newtarget(scope))),
                        Build.Expression(
                          Scope.initialize(
                            scope,
                            "this",
                            Scope.this(scope))),
                        Build.Expression(
                          Scope.initialize(
                            scope,
                            "arguments",
                            Build.apply(
                              Build.builtin("Object.defineProperty"),
                              Build.primitive(void 0),
                              [
                                Build.apply(
                                  Build.builtin("Object.defineProperty"),
                                  Build.primitive(void 0),
                                  [
                                    Build.apply(
                                      Build.builtin("Object.defineProperty"),
                                      Build.primitive(void 0),
                                      [
                                        Build.apply(
                                          Build.builtin("Object.assign"),
                                          Build.primitive(void 0),
                                          [
                                            Build.object(
                                              Build.primitive("Object.prototype"),
                                              []),
                                            Scope.arguments(scope)]),
                                        Build.primitive("length"),
                                        Build.object(
                                          Build.primitive(null),
                                          [
                                            [
                                              Build.primitive("value"),
                                              Object.get(
                                                Scope.arguments(scope),
                                                Build.primitive("length"))],
                                            [
                                              Build.primitive("writable"),
                                              Build.primitive(true)],
                                            [
                                              Build.primitive("configurable"),
                                              Build.primitive(true)]])]),
                                    Build.primitive("callee"),
                                    Build.object(
                                      Build.primitive(null),
                                      (
                                        Scope.$GetStrict(scope) ?
                                        [
                                          [
                                            Build.primitive("get"),
                                            Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
                                          [
                                            Build.primitive("set"),
                                            Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
                                        [
                                          [
                                            Build.primitive("value"),
                                            Scope.callee(scope)],
                                          [
                                            Build.primitive("writable"),
                                            Build.primitive(true)],
                                          [
                                            Build.primitive("configurable"),
                                            Build.primitive(true)]]))]),
                                Build.builtin("Symbol.iterator"),
                                Build.object(
                                  Build.primitive(null),
                                  [
                                    [
                                      Build.primitive("value"),
                                      Build.builtin("Array.prototype.values")],
                                    [
                                      Build.primitive("writable"),
                                      Build.primitive(true)],
                                    [
                                      Build.primitive("configurable"),
                                      Build.primitive(true)]])]))),
                        Build.Block(
                          Scope.BLOCK(
                            scope,
                            [],
                            // > function f (x, [x]) {}
                            // Thrown:
                            // function f (x, [x]) {}
                            //                 ^
                            // 
                            // SyntaxError: Duplicate parameter name not allowed in this context
                            // > function f (x, x) {}
                            // undefined
                            (
                              (
                                Scope.$GetStrict(scope) ||
                                ArrayLite.some(
                                  node.params,
                                  (params) => params.type !== "Identifier")) ?
                              ArrayLite.flatMap(node.params, Pattern.$Identifiers) :
                              ArrayLite.filter(
                                ArrayLite.flatMap(node.params, Pattern.$Identifiers),
                                (identifier, index, identifiers) => ArrayLite.lastIndexOf(identifiers, identifier) === index)),
                            [],
                            (scope) => ArrayLite.concat(
                              ArrayLite.flatMap(
                                node.params,
                                (param, index) => Build.Expression(
                                  Pattern.assign1(
                                    scope,
                                    true,
                                    (
                                      param.type === "RestElement" ?
                                      param.argument :
                                      param),
                                    (
                                      param.type === "RestElement" ?
                                      Build.apply(
                                        Build.builtin("Array.prototype.slice"),
                                        Scope.arguments(scope),
                                        [
                                          Build.primitive(index)]) :
                                      Object.get(
                                        Scope.arguments(scope),
                                        Build.primitive(index)))))),
                              Build.Block(
                                extract(
                                  node.body,
                                  (nodes, labels, identifiers1, identifiers2, identifiers3) => Scope.BLOCK(
                                    labels,
                                    ArrayLite.concat(identifiers1, identifiers2),
                                    identifiers3,
                                    (scope) => ArrayLite.concat(
                                      ArrayLite.flatMap(
                                        identifiers1,
                                        (identifier) => Build.Expression(
                                          Scope.initialize(
                                            scope,
                                            identifier,
                                            Build.primitive(void 0)))),
                                      Lexic.flatMap(
                                        Lexic.Create(null),
                                        labels,
                                        [],
                                        nodes,
                                        (lexic, node) => Visit.Node(node, scope, lexic, []))))))))),
                        Build.Return(
                          Build.conditional(
                            Scope.read(scope, "new.target"),
                            Scope.read(scope, "this"),
                            Build.primitive(void 0)))))),
                  Build.primitive("length"),
                  Build.object(
                    Build.primitive(null),
                    [
                      [
                        Build.primitive("value"),
                        Build.primitive(
                          (
                            (
                              params.length > 0 &&
                              params[params.length - 1].type === "RestElement") ?
                            params.length - 1 :
                            params.length))],
                      [
                        Build.primitive("configurable"),
                        Build.primitive(true)]])]),
              Build.primitive("name"),
              Build.object(
                Build.primitive(null),
                [
                  [
                    Build.primitive("value"),
                    options.name()],
                  [
                    Build.primitive("configurable"),
                    Build.primitive(true)]])])),
        Build.sequence(
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Scope.get(scope, cache2),
              Build.primitive("prototype"),
              Build.apply(
                Build.builtin("Object.defineProperty"),
                Build.primitive(void 0),
                [
                  Build.object(
                    Build.builtin("Object.prototype"),
                    []),
                  Build.primitive("constructor"),
                  Build.object(
                    Build.primitive(null),
                    [
                      [
                        Build.primitive("value"),
                         Scope.get(scope, cache1)],
                      [
                        Build.primitive("writable"),
                        Build.primitive(true)],
                      [
                        Build.primitive("configurable"),
                        Build.primitive(true)]])])]),
          Scope.get(scope, cache2))))));
