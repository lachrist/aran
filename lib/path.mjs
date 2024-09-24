import { AranExecError, AranTypeError } from "./report.mjs";
import { mapIndex, hasNarrowObject } from "./util/index.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split, substring, startsWith },
  },
} = globalThis;

const SEP = ".";

const SEP_SINGLETON = [SEP];

export const ROOT_PATH = /** @type {import("./path").Path} */ ("$");

/**
 * @type {(
 *   path: import("./path").Path,
 *   segment: import("./path").Segment,
 * ) => import("./path").Path}
 */
const joinPath = (path, segment) =>
  /** @type {import("./path").Path} */ (`${path}${SEP}${segment}`);

/**
 * @type {(
 *   path: import("./path").Path,
 *   segment1: import("./path").Segment,
 *   segment2: import("./path").Segment,
 * ) => import("./path").Path}
 */
const joinDeepPath = (path, segment1, segment2) =>
  /** @type {import("./path").Path} */ (
    `${path}${SEP}${segment1}${SEP}${segment2}`
  );

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   path: import("./path").Path,
 * ) => number}
 */
export const getPathDeph = (path) => {
  let depth = 0;
  const { length } = path;
  for (let index = 0; index < length; index += 1) {
    if (path[index] === SEP) {
      depth += 1;
    }
  }
  return depth;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   path: import("./path").Path,
 *   base: import("./path").Path,
 * ) => import("./path").Segment[]}
 */
export const splitPath = (path, base) => {
  if (path === base) {
    return [];
  } else if (apply(startsWith, path, [`${base}${SEP}`])) {
    return apply(
      split,
      apply(substring, path, [base.length + 1]),
      SEP_SINGLETON,
    );
  } else {
    throw new AranExecError("path does not start by base", { path, base });
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   segments: import("./path").Segment[],
 *   root: import("./estree").Program,
 * ) => import("./estree").Node | import("./estree").Node[]}
 */
export const walkPath = (segments, root) => {
  /** @type {import("./estree").Node | import("./estree").Node[]} */
  let node = root;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (hasNarrowObject(node, segment)) {
      node = /** @type {any} */ (node[segment]);
    } else {
      throw new AranExecError("invalid path", {
        segment,
        node,
        path: segments,
        root,
      });
    }
  }
  return node;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   node: import("./estree").Node
 * ) => import("./path").Path}
 */
export const digestPath = (node) => /** @type {any} */ (node)._aran_path_;

/**
 * @type {<N extends import("./estree").Node>(
 *   node: N,
 *   path: import("./path").Path,
 * ) => N}
 */
export const prepareDigestPath = (node, path) => {
  switch (node.type) {
    case "Program": {
      return {
        ...node,
        _aran_path_: path,
        body: mapIndex(node.body.length, (index) =>
          prepareDigestPath(node, joinDeepPath(path, "body", index)),
        ),
      };
    }
    case "BlockStatement": {
      return {
        ...node,
        _aran_path_: path,
        body: mapIndex(node.body.length, (index) =>
          prepareDigestPath(node, joinDeepPath(path, "body", index)),
        ),
      };
    }
    case "EmptyStatement": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "ExpressionStatement": {
      return {
        ...node,
        _aran_path_: path,
        expression: prepareDigestPath(
          node.expression,
          joinPath(path, "expression"),
        ),
      };
    }
    case "IfStatement": {
      return {
        ...node,
        _aran_path_: path,
        test: prepareDigestPath(node.test, joinPath(path, "test")),
        consequent: prepareDigestPath(
          node.consequent,
          joinPath(path, "consequent"),
        ),
        alternate:
          node.alternate == null
            ? null
            : prepareDigestPath(node.alternate, joinPath(path, "alternate")),
      };
    }
    case "WhileStatement": {
      return {
        ...node,
        _aran_path_: path,
        test: prepareDigestPath(node.test, joinPath(path, "test")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "DoWhileStatement": {
      return {
        ...node,
        _aran_path_: path,
        test: prepareDigestPath(node.test, joinPath(path, "test")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "ForStatement": {
      return {
        ...node,
        _aran_path_: path,
        init:
          node.init == null
            ? null
            : prepareDigestPath(node.init, joinPath(path, "init")),
        test:
          node.test == null
            ? null
            : prepareDigestPath(node.test, joinPath(path, "test")),
        update:
          node.update == null
            ? null
            : prepareDigestPath(node.update, joinPath(path, "update")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "ForInStatement": {
      return {
        ...node,
        _aran_path_: path,
        left: prepareDigestPath(node.left, joinPath(path, "left")),
        right: prepareDigestPath(node.right, joinPath(path, "right")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "ForOfStatement": {
      return {
        ...node,
        _aran_path_: path,
        left: prepareDigestPath(node.left, joinPath(path, "left")),
        right: prepareDigestPath(node.right, joinPath(path, "right")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "BreakStatement": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "ContinueStatement": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "ReturnStatement": {
      return {
        ...node,
        _aran_path_: path,
        argument:
          node.argument == null
            ? null
            : prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "WithStatement": {
      return {
        ...node,
        _aran_path_: path,
        object: prepareDigestPath(node.object, joinPath(path, "object")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "SwitchStatement": {
      return {
        ...node,
        _aran_path_: path,
        discriminant: prepareDigestPath(
          node.discriminant,
          joinPath(path, "discriminant"),
        ),
        cases: mapIndex(node.cases.length, (index) =>
          prepareDigestPath(
            node.cases[index],
            joinDeepPath(path, "cases", index),
          ),
        ),
      };
    }
    case "SwitchCase": {
      return {
        ...node,
        _aran_path_: path,
        test:
          node.test == null
            ? null
            : prepareDigestPath(node.test, joinPath(path, "test")),
        consequent: mapIndex(node.consequent.length, (index) =>
          prepareDigestPath(
            node.consequent[index],
            joinDeepPath(path, "consequent", index),
          ),
        ),
      };
    }
    case "ThrowStatement": {
      return {
        ...node,
        _aran_path_: path,
        argument: prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "TryStatement": {
      return {
        ...node,
        _aran_path_: path,
        block: prepareDigestPath(node.block, joinPath(path, "block")),
        handler:
          node.handler == null
            ? null
            : prepareDigestPath(node.handler, joinPath(path, "handler")),
        finalizer:
          node.finalizer == null
            ? null
            : prepareDigestPath(node.finalizer, joinPath(path, "finalizer")),
      };
    }
    case "CatchClause": {
      return {
        ...node,
        _aran_path_: path,
        param:
          node.param == null
            ? null
            : prepareDigestPath(node.param, joinPath(path, "param")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "DebuggerStatement": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "VariableDeclaration": {
      return {
        ...node,
        _aran_path_: path,
        declarations: mapIndex(node.declarations.length, (index) =>
          prepareDigestPath(
            node.declarations[index],
            joinDeepPath(path, "declarations", index),
          ),
        ),
      };
    }
    case "VariableDeclarator": {
      return {
        ...node,
        _aran_path_: path,
        id: prepareDigestPath(node.id, joinPath(path, "id")),
        init:
          node.init == null
            ? null
            : prepareDigestPath(node.init, joinPath(path, "init")),
      };
    }
    case "FunctionDeclaration": {
      return {
        ...node,
        _aran_path_: path,
        id:
          node.id == null
            ? null
            : prepareDigestPath(node.id, joinPath(path, "id")),
        params: mapIndex(node.params.length, (index) =>
          prepareDigestPath(
            node.params[index],
            joinDeepPath(path, "params", index),
          ),
        ),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "FunctionExpression": {
      return {
        ...node,
        _aran_path_: path,
        id:
          node.id == null
            ? null
            : prepareDigestPath(node.id, joinPath(path, "id")),
        params: mapIndex(node.params.length, (index) =>
          prepareDigestPath(
            node.params[index],
            joinDeepPath(path, "params", index),
          ),
        ),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "ArrowFunctionExpression": {
      return {
        ...node,
        _aran_path_: path,
        params: mapIndex(node.params.length, (index) =>
          prepareDigestPath(
            node.params[index],
            joinDeepPath(path, "params", index),
          ),
        ),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "ClassDeclaration": {
      return {
        ...node,
        _aran_path_: path,
        id:
          node.id == null
            ? null
            : prepareDigestPath(node.id, joinPath(path, "id")),
        superClass:
          node.superClass == null
            ? null
            : prepareDigestPath(node.superClass, joinPath(path, "superClass")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "ClassExpression": {
      return {
        ...node,
        _aran_path_: path,
        id:
          node.id == null
            ? null
            : prepareDigestPath(node.id, joinPath(path, "id")),
        superClass:
          node.superClass == null
            ? null
            : prepareDigestPath(node.superClass, joinPath(path, "superClass")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "MethodDefinition": {
      return {
        ...node,
        _aran_path_: path,
        key: prepareDigestPath(node.key, joinPath(path, "key")),
        value: prepareDigestPath(node.value, joinPath(path, "value")),
      };
    }
    case "YieldExpression": {
      return {
        ...node,
        _aran_path_: path,
        argument:
          node.argument == null
            ? null
            : prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "AwaitExpression": {
      return {
        ...node,
        _aran_path_: path,
        argument: prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "ImportDeclaration": {
      return {
        ...node,
        _aran_path_: path,
        specifiers: mapIndex(node.specifiers.length, (index) =>
          prepareDigestPath(
            node.specifiers[index],
            joinDeepPath(path, "specifiers", index),
          ),
        ),
        source: prepareDigestPath(node.source, joinPath(path, "source")),
      };
    }
    case "ImportSpecifier": {
      return {
        ...node,
        _aran_path_: path,
        local: prepareDigestPath(node.local, joinPath(path, "local")),
        imported: prepareDigestPath(node.imported, joinPath(path, "imported")),
      };
    }
    case "ImportDefaultSpecifier": {
      return {
        ...node,
        _aran_path_: path,
        local: prepareDigestPath(node.local, joinPath(path, "local")),
      };
    }
    case "ImportNamespaceSpecifier": {
      return {
        ...node,
        _aran_path_: path,
        local: prepareDigestPath(node.local, joinPath(path, "local")),
      };
    }
    case "ExportNamedDeclaration": {
      return {
        ...node,
        _aran_path_: path,
        declaration:
          node.declaration == null
            ? null
            : prepareDigestPath(
                node.declaration,
                joinPath(path, "declaration"),
              ),
        specifiers: mapIndex(node.specifiers.length, (index) =>
          prepareDigestPath(
            node.specifiers[index],
            joinDeepPath(path, "specifiers", index),
          ),
        ),
        source:
          node.source == null
            ? null
            : prepareDigestPath(node.source, joinPath(path, "source")),
      };
    }
    case "ExportSpecifier": {
      return {
        ...node,
        _aran_path_: path,
        local: prepareDigestPath(node.local, joinPath(path, "local")),
        exported: prepareDigestPath(node.exported, joinPath(path, "exported")),
      };
    }
    case "ExportDefaultDeclaration": {
      return {
        ...node,
        _aran_path_: path,
        declaration: prepareDigestPath(
          node.declaration,
          joinPath(path, "declaration"),
        ),
      };
    }
    case "ExportAllDeclaration": {
      return {
        ...node,
        _aran_path_: path,
        source: prepareDigestPath(node.source, joinPath(path, "source")),
      };
    }
    case "ArrayExpression": {
      return {
        ...node,
        _aran_path_: path,
        elements: mapIndex(node.elements.length, (index) =>
          node.elements[index] == null
            ? null
            : prepareDigestPath(
                node.elements[index],
                joinDeepPath(path, "elements", index),
              ),
        ),
      };
    }
    case "ObjectExpression": {
      return {
        ...node,
        _aran_path_: path,
        properties: mapIndex(node.properties.length, (index) =>
          prepareDigestPath(
            node.properties[index],
            joinDeepPath(path, "properties", index),
          ),
        ),
      };
    }
    case "Property": {
      return {
        ...node,
        _aran_path_: path,
        key: prepareDigestPath(node.key, joinPath(path, "key")),
        value: prepareDigestPath(node.value, joinPath(path, "value")),
      };
    }
    case "Literal": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "ArrayPattern": {
      return {
        ...node,
        _aran_path_: path,
        elements: mapIndex(node.elements.length, (index) =>
          node.elements[index] == null
            ? null
            : prepareDigestPath(
                node.elements[index],
                joinDeepPath(path, "elements", index),
              ),
        ),
      };
    }
    case "AssignmentExpression": {
      return {
        ...node,
        _aran_path_: path,
        left: prepareDigestPath(node.left, joinPath(path, "left")),
        right: prepareDigestPath(node.right, joinPath(path, "right")),
      };
    }
    case "AssignmentPattern": {
      return {
        ...node,
        _aran_path_: path,
        left: prepareDigestPath(node.left, joinPath(path, "left")),
        right: prepareDigestPath(node.right, joinPath(path, "right")),
      };
    }
    case "ObjectPattern": {
      return {
        ...node,
        _aran_path_: path,
        properties: mapIndex(node.properties.length, (index) =>
          prepareDigestPath(
            node.properties[index],
            joinDeepPath(path, "properties", index),
          ),
        ),
      };
    }
    case "RestElement": {
      return {
        ...node,
        _aran_path_: path,
        argument: prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "BinaryExpression": {
      return {
        ...node,
        _aran_path_: path,
        left: prepareDigestPath(node.left, joinPath(path, "left")),
        right: prepareDigestPath(node.right, joinPath(path, "right")),
      };
    }
    case "LogicalExpression": {
      return {
        ...node,
        _aran_path_: path,
        left: prepareDigestPath(node.left, joinPath(path, "left")),
        right: prepareDigestPath(node.right, joinPath(path, "right")),
      };
    }
    case "UnaryExpression": {
      return {
        ...node,
        _aran_path_: path,
        argument: prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "UpdateExpression": {
      return {
        ...node,
        _aran_path_: path,
        argument: prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "ConditionalExpression": {
      return {
        ...node,
        _aran_path_: path,
        test: prepareDigestPath(node.test, joinPath(path, "test")),
        consequent: prepareDigestPath(
          node.consequent,
          joinPath(path, "consequent"),
        ),
        alternate: prepareDigestPath(
          node.alternate,
          joinPath(path, "alternate"),
        ),
      };
    }
    case "NewExpression": {
      return {
        ...node,
        _aran_path_: path,
        callee: prepareDigestPath(node.callee, joinPath(path, "callee")),
        arguments: mapIndex(node.arguments.length, (index) =>
          prepareDigestPath(
            node.arguments[index],
            joinDeepPath(path, "arguments", index),
          ),
        ),
      };
    }
    case "CallExpression": {
      return {
        ...node,
        _aran_path_: path,
        callee: prepareDigestPath(node.callee, joinPath(path, "callee")),
        arguments: mapIndex(node.arguments.length, (index) =>
          prepareDigestPath(
            node.arguments[index],
            joinDeepPath(path, "arguments", index),
          ),
        ),
      };
    }
    case "MemberExpression": {
      return {
        ...node,
        _aran_path_: path,
        object: prepareDigestPath(node.object, joinPath(path, "object")),
        property: prepareDigestPath(node.property, joinPath(path, "property")),
      };
    }
    case "Identifier": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "ThisExpression": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "Super": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "MetaProperty": {
      return {
        ...node,
        _aran_path_: path,
        meta: prepareDigestPath(node.meta, joinPath(path, "meta")),
        property: prepareDigestPath(node.property, joinPath(path, "property")),
      };
    }
    case "LabeledStatement": {
      return {
        ...node,
        _aran_path_: path,
        label: prepareDigestPath(node.label, joinPath(path, "label")),
        body: prepareDigestPath(node.body, joinPath(path, "body")),
      };
    }
    case "ChainExpression": {
      return {
        ...node,
        _aran_path_: path,
        expression: prepareDigestPath(
          node.expression,
          joinPath(path, "expression"),
        ),
      };
    }
    case "ClassBody": {
      return {
        ...node,
        _aran_path_: path,
        body: mapIndex(node.body.length, (index) =>
          prepareDigestPath(node, joinDeepPath(path, "body", index)),
        ),
      };
    }
    case "ImportExpression": {
      return {
        ...node,
        _aran_path_: path,
        source: prepareDigestPath(node.source, joinPath(path, "source")),
      };
    }
    case "PrivateIdentifier": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    case "PropertyDefinition": {
      return {
        ...node,
        _aran_path_: path,
        key: prepareDigestPath(node.key, joinPath(path, "key")),
        value:
          node.value == null
            ? null
            : prepareDigestPath(node.value, joinPath(path, "value")),
      };
    }
    case "SequenceExpression": {
      return {
        ...node,
        _aran_path_: path,
        expressions: mapIndex(node.expressions.length, (index) =>
          prepareDigestPath(
            node.expressions[index],
            joinDeepPath(path, "expressions", index),
          ),
        ),
      };
    }
    case "TemplateLiteral": {
      return {
        ...node,
        _aran_path_: path,
        quasis: mapIndex(node.quasis.length, (index) =>
          prepareDigestPath(
            node.quasis[index],
            joinDeepPath(path, "quasis", index),
          ),
        ),
        expressions: mapIndex(node.expressions.length, (index) =>
          prepareDigestPath(
            node.expressions[index],
            joinDeepPath(path, "expressions", index),
          ),
        ),
      };
    }
    case "SpreadElement": {
      return {
        ...node,
        _aran_path_: path,
        argument: prepareDigestPath(node.argument, joinPath(path, "argument")),
      };
    }
    case "StaticBlock": {
      return {
        ...node,
        _aran_path_: path,
        body: mapIndex(node.body.length, (index) =>
          prepareDigestPath(node, joinDeepPath(path, "body", index)),
        ),
      };
    }
    case "TaggedTemplateExpression": {
      return {
        ...node,
        _aran_path_: path,
        tag: prepareDigestPath(node.tag, joinPath(path, "tag")),
        quasi: prepareDigestPath(node.quasi, joinPath(path, "quasi")),
      };
    }
    case "TemplateElement": {
      return {
        ...node,
        _aran_path_: path,
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
