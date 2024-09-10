/* eslint-disable no-use-before-define */
import { AranExecError, AranTypeError } from "../../report.mjs";
import {
  map,
  mapReduce,
  EMPTY_TREE,
  reduceEntry,
  listTreeLeaf,
} from "../../util/index.mjs";
import { listBinding } from "./hoist.mjs";

const {
  Array: { isArray },
  Object: { hasOwn },
  Reflect: { defineProperty },
} = globalThis;

////////////
// Export //
////////////

/**
 * @type {(
 *   deadzone: import("./deadzone").Deadzone,
 *   hash: import("../../hash").Hash,
 * ) => import("./deadzone").DeadzoneStatus}
 */
export const fetchDeadzoneStatus = (deadzone, hash) => {
  if (hasOwn(deadzone, hash)) {
    const annotation = /** @type {import("./deadzone").DeadzoneAnnotation} */ (
      deadzone[hash]
    );
    if (isArray(annotation)) {
      throw new AranExecError("expected a deadzone status", {
        hash,
        annotation,
        deadzone,
      });
    } else if (typeof annotation === "string") {
      return annotation;
    } else {
      throw new AranTypeError(annotation);
    }
  } else {
    throw new AranExecError("missing deadzone status", { hash, deadzone });
  }
};

/**
 * @type {(
 *   deadzone: import("./deadzone").Deadzone,
 *   hash: import("../../hash").Hash,
 * ) => import("./deadzone").PackDeadzoneScope}
 */
export const fetchDeadzoneScope = (deadzone, hash) => {
  if (hasOwn(deadzone, hash)) {
    const annotation = /** @type {import("./deadzone").DeadzoneAnnotation} */ (
      deadzone[hash]
    );
    if (isArray(annotation)) {
      return annotation;
    } else if (typeof annotation === "string") {
      throw new AranExecError("expected a deadzone scope", {
        hash,
        annotation,
        deadzone,
      });
    } else {
      throw new AranTypeError(annotation);
    }
  } else {
    throw new AranExecError("missing deadzone scope", { hash, deadzone });
  }
};

/**
 * @type {(
 *   node: import("../../estree").Program,
 *   boot: null | import("./deadzone").PackDeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("./deadzone").Deadzone}
 */
export const annotateDeadzone = (node, boot, digest, hoisting) =>
  reduceEntry(listTreeLeaf(zoneProgram(node, unpack(boot), digest, hoisting)));

///////////
// Scope //
///////////

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   scope: import("./deadzone").DeadzoneScope,
 * ) => import("./deadzone").PackDeadzoneScope}
 */
const pack = (scope) => {
  /** @type {import("./deadzone").PackDeadzoneScope} */
  const entries = [];
  let length = 0;
  for (const key in scope) {
    entries[length++] = [
      /** @type {import("../../estree").Variable} */ (key),
      /** @type {any} */ (scope)[key],
    ];
  }
  return entries;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   boot: null | import("./deadzone").PackDeadzoneScope,
 * ) => import("./deadzone").DeadzoneScope}
 */
const unpack = (boot) =>
  /** @type {any} */ (
    boot === null
      ? { __proto__: null }
      : {
          __proto__: null,
          ...reduceEntry(boot),
        }
  );

/**
 * @type {(
 *   binding: import("./hoist-public").Binding,
 * ) => import("./deadzone").DeadzoneBinding}
 */
const toBaselineBinding = ({ variable, baseline }) => [variable, baseline];

/**
 * @type {(
 *   binding: import("./hoist-public").Binding,
 * ) => import("./deadzone").DeadzoneBinding}
 */
const toUnknownBinding = ({ variable, baseline }) => {
  switch (baseline) {
    case "dead": {
      return [variable, "unknown"];
    }
    case "live": {
      return [variable, "live"];
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

const UNKNOWN_DESCRIPTOR = {
  __proto__: null,
  value: "unknown",
  writable: true,
  enumerable: true,
  configurable: true,
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   scope: import("./deadzone").DeadzoneScope,
 * ) => import("./deadzone").DeadzoneScope}
 */
const enclose = (scope) => {
  const new_scope = /** @type {import("./deadzone").DeadzoneScope} */ ({
    __proto__: scope,
  });
  for (const key in scope) {
    if (/** @type {any} */ (scope)[key] === "dead") {
      defineProperty(new_scope, key, UNKNOWN_DESCRIPTOR);
    }
  }
  return new_scope;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   scope: import("./deadzone").DeadzoneScope,
 *   bindings: import("./deadzone").DeadzoneBinding[],
 * ) => import("./deadzone").DeadzoneScope}
 */
const extendMultiple = (scope, entries) =>
  /** @type {any} */ ({
    __proto__: scope,
    ...reduceEntry(entries),
  });

/**
 * @type {(
 *   scope: import("./deadzone").DeadzoneScope,
 *   key: import("../../estree").Variable,
 *   val: import("./deadzone").DeadzoneStatus,
 * ) => import("./deadzone").DeadzoneScope}
 */
const extendSingle = (scope, key, val) =>
  /** @type {any} */ ({
    __proto__: scope,
    [key]: val,
  });

/**
 * @type {(
 *   scope: import("./deadzone").DeadzoneScope,
 *   variable: import("../../estree").Variable,
 * ) => import("./deadzone").DeadzoneStatus}
 */
const lookup = (scope, variable) =>
  variable in scope ? scope[variable] : "unknown";

///////////
// Visit //
///////////

/**
 * @type {(
 *   node: import("../../estree").Program,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneProgram = (node, scope, digest, hoisting) => {
  const { 0: branches } = mapReduce(node.body, scope, (child, scope) =>
    zoneProgramStatement(child, scope, digest, hoisting),
  );
  return {
    type: "binary-node",
    branch1: {
      type: "multi-node",
      branches: map(node.body, (child) =>
        zoneHoistNode(child, scope, digest, hoisting),
      ),
    },
    branch2: {
      type: "multi-node",
      branches,
    },
  };
};

/**
 * @type {(
 *   node: import("../../estree").VariableDeclarator,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => [
 *   import("../../util/tree").Tree<
 *     import("./deadzone").DeadzoneEntry
 *   >,
 *   import("./deadzone").DeadzoneScope,
 * ]}
 */
const zoneInitializeDeclarator = (node, scope, digest, hoisting) =>
  zoneInitializePattern(node.id, scope, digest, hoisting);

/**
 * @type {(
 *   node: import("../../estree").VariableDeclarator,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneAssignDeclarator = (node, scope, digest, hoisting) =>
  zoneAssignPattern(node.id, scope, digest, hoisting);

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Directive
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *   ),
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => [
 *   import("../../util/tree").Tree<
 *     import("./deadzone").DeadzoneEntry
 *   >,
 *   import("./deadzone").DeadzoneScope,
 * ]}
 */
const zoneProgramStatement = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "ExportAllDeclaration": {
      return [EMPTY_TREE, scope];
    }
    case "ExportDefaultDeclaration": {
      return zoneDefaultExport(node.declaration, scope, digest, hoisting);
    }
    case "ExportNamedDeclaration": {
      return node.declaration == null
        ? [EMPTY_TREE, scope]
        : zoneBodyStatement(node.declaration, scope, digest, hoisting);
    }
    case "ImportDeclaration": {
      return [EMPTY_TREE, scope];
    }
    case "VariableDeclaration": {
      if (node.kind === "var") {
        return [
          {
            type: "multi-node",
            branches: map(node.declarations, (child) =>
              zoneAssignDeclarator(child, scope, digest, hoisting),
            ),
          },
          scope,
        ];
      } else if (node.kind === "let" || node.kind === "const") {
        const { 0: branches, 1: new_scope } = mapReduce(
          node.declarations,
          scope,
          (child, scope) =>
            zoneInitializeDeclarator(child, scope, digest, hoisting),
        );
        return [
          {
            type: "multi-node",
            branches,
          },
          new_scope,
        ];
      } else {
        throw new AranTypeError(node.kind);
      }
    }
    default: {
      return [zoneBlockStatement(node, scope, digest, hoisting), scope];
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").DefaultExport,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => [
 *   import("../../util/tree").Tree<
 *     import("./deadzone").DeadzoneEntry
 *   >,
 *   import("./deadzone").DeadzoneScope,
 * ]}
 */
const zoneDefaultExport = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "FunctionDeclaration": {
      return [zoneFunction(node, scope, digest, hoisting), scope];
    }
    case "ClassDeclaration": {
      if (node.id == null) {
        return [zoneClass(node, scope, digest, hoisting), scope];
      } else {
        return zoneBodyStatement(node, scope, digest, hoisting);
      }
    }
    default: {
      return [zoneExpression(node, scope, digest, hoisting), scope];
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").Statement,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => [
 *   import("../../util/tree").Tree<
 *     import("./deadzone").DeadzoneEntry
 *   >,
 *   import("./deadzone").DeadzoneScope,
 * ]}
 */
const zoneBodyStatement = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.kind === "var") {
        return [
          {
            type: "multi-node",
            branches: map(node.declarations, (child) =>
              zoneAssignDeclarator(child, scope, digest, hoisting),
            ),
          },
          scope,
        ];
      } else if (node.kind === "let" || node.kind === "const") {
        const { 0: branches, 1: new_scope } = mapReduce(
          node.declarations,
          scope,
          (child, scope) =>
            zoneInitializeDeclarator(child, scope, digest, hoisting),
        );
        return [
          {
            type: "multi-node",
            branches,
          },
          new_scope,
        ];
      } else {
        throw new AranTypeError(node.kind);
      }
    }
    case "ClassDeclaration": {
      return [
        zoneClass(node, scope, digest, hoisting),
        extendSingle(scope, node.id.name, "live"),
      ];
    }
    default: {
      return [zoneBlockStatement(node, scope, digest, hoisting), scope];
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").CatchClause,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneCatchClause = (node, scope, digest, hoisting) => {
  if (node.param == null) {
    return zoneBlockStatement(node.body, scope, digest, hoisting);
  } else {
    const { 0: branch1, 1: new_scope } = zoneInitializePattern(
      node.param,
      scope,
      digest,
      hoisting,
    );
    return {
      type: "binary-node",
      branch1,
      branch2: zoneBlockStatement(node.body, new_scope, digest, hoisting),
    };
  }
};

/**
 * @type {(
 *   node: import("../../estree").SwitchCase,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => [
 *   import("../../util/tree").Tree<
 *     import("./deadzone").DeadzoneEntry
 *   >,
 *   import("./deadzone").DeadzoneScope,
 * ]}
 */
const zoneSwitchCase = (node, scope, digest, hoisting) => {
  const { 0: branches } = mapReduce(node.consequent, scope, (child, scope) =>
    zoneBodyStatement(child, scope, digest, hoisting),
  );
  return [
    {
      type: "binary-node",
      branch1:
        node.test == null
          ? EMPTY_TREE
          : zoneExpression(node.test, scope, digest, hoisting),
      branch2: {
        type: "multi-node",
        branches,
      },
    },
    extendMultiple(
      scope,
      map(listBinding(hoisting, digest(node)), toUnknownBinding),
    ),
  ];
};

/**
 * @type {(
 *   node: import("../../estree").Node,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneHoistNode = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "LabeledStatement": {
      return zoneHoistNode(node.body, scope, digest, hoisting);
    }
    case "SwitchCase": {
      return {
        type: "multi-node",
        branches: map(node.consequent, (child) =>
          zoneHoistNode(child, scope, digest, hoisting),
        ),
      };
    }
    case "IfStatement": {
      return {
        type: "binary-node",
        branch1: zoneHoistNode(node.consequent, scope, digest, hoisting),
        branch2:
          node.alternate == null
            ? EMPTY_TREE
            : zoneHoistNode(node.consequent, scope, digest, hoisting),
      };
    }
    case "ExportDefaultDeclaration": {
      return node.declaration == null
        ? EMPTY_TREE
        : zoneHoistNode(node.declaration, scope, digest, hoisting);
    }
    case "ExportNamedDeclaration": {
      return node.declaration == null
        ? EMPTY_TREE
        : zoneHoistNode(node.declaration, scope, digest, hoisting);
    }
    case "FunctionDeclaration": {
      return zoneFunction(node, scope, digest, hoisting);
    }
    default: {
      return EMPTY_TREE;
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").Statement,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneBlockStatement = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "BreakStatement": {
      return EMPTY_TREE;
    }
    case "ContinueStatement": {
      return EMPTY_TREE;
    }
    case "DebuggerStatement": {
      return EMPTY_TREE;
    }
    case "EmptyStatement": {
      return EMPTY_TREE;
    }
    case "ReturnStatement": {
      return node.argument == null
        ? EMPTY_TREE
        : zoneExpression(node.argument, scope, digest, hoisting);
    }
    case "ThrowStatement": {
      return zoneExpression(node.argument, scope, digest, hoisting);
    }
    case "VariableDeclaration": {
      if (node.kind === "var") {
        return {
          type: "multi-node",
          branches: map(node.declarations, (child) =>
            zoneAssignDeclarator(child, scope, digest, hoisting),
          ),
        };
      } else {
        // This is an early syntax error
        return EMPTY_TREE;
      }
    }
    case "FunctionDeclaration": {
      return zoneFunction(node, scope, digest, hoisting);
    }
    case "ClassDeclaration": {
      // This is an early syntax error
      return EMPTY_TREE;
    }
    case "LabeledStatement": {
      return zoneBlockStatement(node.body, scope, digest, hoisting);
    }
    case "BlockStatement": {
      const new_scope = extendMultiple(
        scope,
        map(listBinding(hoisting, digest(node)), toBaselineBinding),
      );
      const { 0: branches } = mapReduce(node.body, new_scope, (child, scope) =>
        zoneBodyStatement(child, scope, digest, hoisting),
      );
      return {
        type: "binary-node",
        branch1: {
          type: "multi-node",
          branches: map(node.body, (child) =>
            zoneHoistNode(child, new_scope, digest, hoisting),
          ),
        },
        branch2: {
          type: "multi-node",
          branches,
        },
      };
    }
    case "ExpressionStatement": {
      return zoneExpression(node.expression, scope, digest, hoisting);
    }
    case "IfStatement": {
      return {
        type: "ternary-node",
        branch1: zoneExpression(node.test, scope, digest, hoisting),
        branch2: zoneBlockStatement(node.consequent, scope, digest, hoisting),
        branch3: node.alternate
          ? zoneBlockStatement(node.alternate, scope, digest, hoisting)
          : EMPTY_TREE,
      };
    }
    case "WithStatement": {
      return zoneBlockStatement(node.body, scope, digest, hoisting);
    }
    case "TryStatement": {
      return {
        type: "ternary-node",
        branch1: zoneBlockStatement(node.block, scope, digest, hoisting),
        branch2:
          node.handler == null
            ? EMPTY_TREE
            : zoneCatchClause(node.handler, scope, digest, hoisting),
        branch3:
          node.finalizer == null
            ? EMPTY_TREE
            : zoneBlockStatement(node.finalizer, scope, digest, hoisting),
      };
    }
    case "WhileStatement": {
      return {
        type: "binary-node",
        branch1: zoneExpression(node.test, scope, digest, hoisting),
        branch2: zoneBlockStatement(node.body, scope, digest, hoisting),
      };
    }
    case "DoWhileStatement": {
      return {
        type: "binary-node",
        branch1: zoneBlockStatement(node.body, scope, digest, hoisting),
        branch2: zoneExpression(node.test, scope, digest, hoisting),
      };
    }
    case "ForStatement": {
      if (node.init != null && node.init.type === "VariableDeclaration") {
        const { 0: branch1, 1: new_scope } = zoneBodyStatement(
          node.init,
          extendMultiple(
            scope,
            map(listBinding(hoisting, digest(node)), toBaselineBinding),
          ),
          digest,
          hoisting,
        );
        return {
          type: "quaternary-node",
          branch1,
          branch2:
            node.test == null
              ? EMPTY_TREE
              : zoneExpression(node.test, new_scope, digest, hoisting),
          branch3:
            node.update == null
              ? EMPTY_TREE
              : zoneExpression(node.update, new_scope, digest, hoisting),
          branch4: zoneBlockStatement(node.body, new_scope, digest, hoisting),
        };
      } else {
        return {
          type: "quaternary-node",
          branch1:
            node.init == null
              ? EMPTY_TREE
              : zoneExpression(node.init, scope, digest, hoisting),
          branch2:
            node.test == null
              ? EMPTY_TREE
              : zoneExpression(node.test, scope, digest, hoisting),
          branch3:
            node.update == null
              ? EMPTY_TREE
              : zoneExpression(node.update, scope, digest, hoisting),
          branch4: zoneBlockStatement(node.body, scope, digest, hoisting),
        };
      }
    }
    case "ForInStatement": {
      if (node.left.type === "VariableDeclaration") {
        const { 0: branch1, 1: new_scope } = zoneBodyStatement(
          node.left,
          extendMultiple(
            scope,
            map(listBinding(hoisting, digest(node)), toBaselineBinding),
          ),
          digest,
          hoisting,
        );
        return {
          type: "ternary-node",
          branch1,
          branch2: zoneExpression(node.right, new_scope, digest, hoisting),
          branch3: zoneBlockStatement(node.body, new_scope, digest, hoisting),
        };
      } else {
        return {
          type: "ternary-node",
          branch1: zoneAssignPattern(node.left, scope, digest, hoisting),
          branch2: zoneExpression(node.right, scope, digest, hoisting),
          branch3: zoneBlockStatement(node.body, scope, digest, hoisting),
        };
      }
    }
    case "ForOfStatement": {
      if (node.left.type === "VariableDeclaration") {
        const { 0: branch1, 1: new_scope } = zoneBodyStatement(
          node.left,
          extendMultiple(
            scope,
            map(listBinding(hoisting, digest(node)), toBaselineBinding),
          ),
          digest,
          hoisting,
        );
        return {
          type: "ternary-node",
          branch1,
          branch2: zoneExpression(node.right, new_scope, digest, hoisting),
          branch3: zoneBlockStatement(node.body, new_scope, digest, hoisting),
        };
      } else {
        return {
          type: "ternary-node",
          branch1: zoneAssignPattern(node.left, scope, digest, hoisting),
          branch2: zoneExpression(node.right, scope, digest, hoisting),
          branch3: zoneBlockStatement(node.body, scope, digest, hoisting),
        };
      }
    }
    case "SwitchStatement": {
      const new_scope = extendMultiple(
        scope,
        map(listBinding(hoisting, digest(node)), toBaselineBinding),
      );
      const { 0: branches } = mapReduce(node.cases, new_scope, (child, scope) =>
        zoneSwitchCase(child, scope, digest, hoisting),
      );
      return {
        type: "ternary-node",
        branch1: zoneExpression(node.discriminant, scope, digest, hoisting),
        branch2: {
          type: "multi-node",
          branches: map(node.cases, (child) =>
            zoneHoistNode(child, new_scope, digest, hoisting),
          ),
        },
        branch3: {
          type: "multi-node",
          branches,
        },
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").ObjectProperty
 *     | import("../../estree").SpreadElement
 *   ),
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneObjectProperty = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "Property": {
      if (node.computed) {
        return {
          type: "binary-node",
          branch1: zoneExpression(node.key, scope, digest, hoisting),
          branch2: zoneExpression(node.value, scope, digest, hoisting),
        };
      } else {
        return zoneExpression(node.value, scope, digest, hoisting);
      }
    }
    case "SpreadElement": {
      return zoneExpression(node.argument, scope, digest, hoisting);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Pattern
 *     | import("../../estree").PatternProperty
 *   ),
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneAssignPattern = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "Identifier": {
      return {
        type: "unary-leaf",
        leaf: [digest(node), lookup(scope, node.name)],
      };
    }
    case "ObjectPattern": {
      return {
        type: "multi-node",
        branches: map(node.properties, (child) =>
          zoneAssignPattern(child, scope, digest, hoisting),
        ),
      };
    }
    case "ArrayPattern": {
      return {
        type: "multi-node",
        branches: map(node.elements, (child) =>
          child == null
            ? EMPTY_TREE
            : zoneAssignPattern(child, scope, digest, hoisting),
        ),
      };
    }
    case "RestElement": {
      return zoneAssignPattern(node.argument, scope, digest, hoisting);
    }
    case "AssignmentPattern": {
      return {
        type: "binary-node",
        branch1: zoneAssignPattern(node.left, scope, digest, hoisting),
        branch2: zoneExpression(node.right, scope, digest, hoisting),
      };
    }
    case "MemberExpression": {
      if (node.computed) {
        return {
          type: "binary-node",
          branch1: zoneExpression(node.object, scope, digest, hoisting),
          branch2: zoneExpression(node.property, scope, digest, hoisting),
        };
      } else {
        return zoneExpression(node.object, scope, digest, hoisting);
      }
    }
    case "Property": {
      if (node.computed) {
        return {
          type: "binary-node",
          branch1: zoneExpression(node.key, scope, digest, hoisting),
          branch2: zoneAssignPattern(node.value, scope, digest, hoisting),
        };
      } else {
        return zoneAssignPattern(node.value, scope, digest, hoisting);
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Pattern
 *     | import("../../estree").PatternProperty
 *   ),
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => [
 *   entries: import("../../util/tree").Tree<
 *     import("./deadzone").DeadzoneEntry
 *   >,
 *   import("./deadzone").DeadzoneScope,
 * ]}
 */
const zoneInitializePattern = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "Identifier": {
      return [
        {
          type: "unary-leaf",
          leaf: [digest(node), lookup(scope, node.name)],
        },
        extendSingle(scope, node.name, "live"),
      ];
    }
    case "ObjectPattern": {
      const { 0: branches, 1: new_scope } = mapReduce(
        node.properties,
        scope,
        (child, scope) => zoneInitializePattern(child, scope, digest, hoisting),
      );
      return [
        {
          type: "multi-node",
          branches,
        },
        new_scope,
      ];
    }
    case "ArrayPattern": {
      const { 0: branches, 1: new_scope } = mapReduce(
        node.elements,
        scope,
        (child, scope) =>
          child == null
            ? [EMPTY_TREE, scope]
            : zoneInitializePattern(child, scope, digest, hoisting),
      );
      return [
        {
          type: "multi-node",
          branches,
        },
        new_scope,
      ];
    }
    case "RestElement": {
      return zoneInitializePattern(node.argument, scope, digest, hoisting);
    }
    case "AssignmentPattern": {
      const { 0: branch2, 1: new_scope } = zoneInitializePattern(
        node.left,
        scope,
        digest,
        hoisting,
      );
      return [
        {
          type: "binary-node",
          branch1: zoneExpression(node.right, scope, digest, hoisting),
          branch2,
        },
        new_scope,
      ];
    }
    case "MemberExpression": {
      if (node.computed) {
        return [
          {
            type: "binary-node",
            branch1: zoneExpression(node.object, scope, digest, hoisting),
            branch2: zoneExpression(node.property, scope, digest, hoisting),
          },
          scope,
        ];
      } else {
        return [zoneExpression(node.object, scope, digest, hoisting), scope];
      }
    }
    case "Property": {
      if (node.computed) {
        const { 0: branch2, 1: new_scope } = zoneInitializePattern(
          node.value,
          scope,
          digest,
          hoisting,
        );
        return [
          {
            type: "binary-node",
            branch1: zoneExpression(node.key, scope, digest, hoisting),
            branch2,
          },
          new_scope,
        ];
      } else {
        return zoneInitializePattern(node.value, scope, digest, hoisting);
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").Function,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneFunction = (node, scope, digest, hoisting) => {
  const scope1 = enclose(scope);
  const scope2 =
    node.type === "ArrowFunctionExpression" || node.id == null
      ? scope1
      : extendSingle(scope1, node.id.name, "live");
  /** @type {import("./deadzone").DeadzoneScope} */
  const scope3 =
    node.type === "ArrowFunctionExpression"
      ? scope2
      : extendSingle(
          scope2,
          /** @type {import("../../estree").Variable} */ ("arguments"),
          "live",
        );
  const scope4 = extendMultiple(
    scope3,
    map(listBinding(hoisting, digest(node)), toBaselineBinding),
  );
  const { 0: branches, 1: new_scope } = mapReduce(
    node.params,
    scope4,
    (child, scope) => zoneInitializePattern(child, scope, digest, hoisting),
  );
  return {
    type: "binary-node",
    branch1: {
      type: "multi-node",
      branches,
    },
    branch2:
      node.body.type === "BlockStatement"
        ? zoneBlockStatement(node.body, new_scope, digest, hoisting)
        : zoneExpression(node.body, new_scope, digest, hoisting),
  };
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Expression
 *     | import("../../estree").SpreadElement
 *     | import("../../estree").Super
 *   ),
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneExpression = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "Super": {
      return EMPTY_TREE;
    }
    case "MetaProperty": {
      return EMPTY_TREE;
    }
    case "ThisExpression": {
      return EMPTY_TREE;
    }
    case "Literal": {
      return EMPTY_TREE;
    }
    case "Identifier": {
      return {
        type: "unary-leaf",
        leaf: [digest(node), lookup(scope, node.name)],
      };
    }
    case "ArrayExpression": {
      return {
        type: "multi-node",
        branches: map(node.elements, (child) =>
          child == null
            ? EMPTY_TREE
            : zoneExpression(child, scope, digest, hoisting),
        ),
      };
    }
    case "ObjectExpression": {
      return {
        type: "multi-node",
        branches: map(node.properties, (child) =>
          zoneObjectProperty(child, scope, digest, hoisting),
        ),
      };
    }
    case "AssignmentExpression": {
      return {
        type: "binary-node",
        branch1: zoneAssignPattern(node.left, scope, digest, hoisting),
        branch2: zoneExpression(node.right, scope, digest, hoisting),
      };
    }
    case "UpdateExpression": {
      return zoneAssignPattern(node.argument, scope, digest, hoisting);
    }
    case "UnaryExpression": {
      return zoneExpression(node.argument, scope, digest, hoisting);
    }
    case "BinaryExpression": {
      return {
        type: "binary-node",
        branch1:
          node.left.type === "PrivateIdentifier"
            ? EMPTY_TREE
            : zoneExpression(node.left, scope, digest, hoisting),
        branch2: zoneExpression(node.right, scope, digest, hoisting),
      };
    }
    case "AwaitExpression": {
      return zoneExpression(node.argument, scope, digest, hoisting);
    }
    case "YieldExpression": {
      if (node.argument == null) {
        return EMPTY_TREE;
      } else {
        return zoneExpression(node.argument, scope, digest, hoisting);
      }
    }
    case "SpreadElement": {
      return zoneExpression(node.argument, scope, digest, hoisting);
    }
    case "LogicalExpression": {
      return {
        type: "binary-node",
        branch1: zoneExpression(node.left, scope, digest, hoisting),
        branch2: zoneExpression(node.right, scope, digest, hoisting),
      };
    }
    case "ConditionalExpression": {
      return {
        type: "ternary-node",
        branch1: zoneExpression(node.test, scope, digest, hoisting),
        branch2: zoneExpression(node.consequent, scope, digest, hoisting),
        branch3: zoneExpression(node.alternate, scope, digest, hoisting),
      };
    }
    case "NewExpression": {
      return {
        type: "binary-node",
        branch1: zoneExpression(node.callee, scope, digest, hoisting),
        branch2: {
          type: "multi-node",
          branches: map(node.arguments, (child) =>
            zoneExpression(child, scope, digest, hoisting),
          ),
        },
      };
    }
    case "CallExpression": {
      return {
        type: "ternary-node",
        branch1: zoneExpression(node.callee, scope, digest, hoisting),
        branch2: {
          type: "multi-node",
          branches: map(node.arguments, (child) =>
            zoneExpression(child, scope, digest, hoisting),
          ),
        },
        branch3:
          node.callee.type === "Identifier" && node.callee.name === "eval"
            ? {
                type: "unary-leaf",
                leaf: [digest(node), pack(scope)],
              }
            : EMPTY_TREE,
      };
    }
    case "MemberExpression": {
      if (node.computed) {
        return {
          type: "binary-node",
          branch1: zoneExpression(node.object, scope, digest, hoisting),
          branch2: zoneExpression(node.property, scope, digest, hoisting),
        };
      } else {
        return zoneExpression(node.object, scope, digest, hoisting);
      }
    }
    case "TaggedTemplateExpression": {
      return {
        type: "binary-node",
        branch1: zoneExpression(node.tag, scope, digest, hoisting),
        branch2: {
          type: "multi-node",
          branches: map(node.quasi.expressions, (child) =>
            zoneExpression(child, scope, digest, hoisting),
          ),
        },
      };
    }
    case "TemplateLiteral": {
      return {
        type: "multi-node",
        branches: map(node.expressions, (child) =>
          zoneExpression(child, scope, digest, hoisting),
        ),
      };
    }
    case "ArrowFunctionExpression": {
      return zoneFunction(node, scope, digest, hoisting);
    }
    case "FunctionExpression": {
      return zoneFunction(node, scope, digest, hoisting);
    }
    case "ChainExpression": {
      return zoneExpression(node.expression, scope, digest, hoisting);
    }
    case "ClassExpression": {
      return zoneClass(node, scope, digest, hoisting);
    }
    case "ImportExpression": {
      return zoneExpression(node.source, scope, digest, hoisting);
    }
    case "SequenceExpression": {
      return {
        type: "multi-node",
        branches: map(node.expressions, (child) =>
          zoneExpression(child, scope, digest, hoisting),
        ),
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   ),
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneClassElement = (node, scope, digest, hoisting) => {
  switch (node.type) {
    case "MethodDefinition": {
      return {
        type: "binary-node",
        branch1: node.computed
          ? zoneExpression(node.key, scope, digest, hoisting)
          : EMPTY_TREE,
        branch2: zoneFunction(node.value, scope, digest, hoisting),
      };
    }
    case "PropertyDefinition": {
      return {
        type: "binary-node",
        branch1: node.computed
          ? zoneExpression(node.key, scope, digest, hoisting)
          : EMPTY_TREE,
        branch2:
          node.value != null
            ? zoneExpression(node.value, scope, digest, hoisting)
            : EMPTY_TREE,
      };
    }
    case "StaticBlock": {
      const new_scope = extendMultiple(
        scope,
        map(listBinding(hoisting, digest(node)), toBaselineBinding),
      );
      const { 0: branches } = mapReduce(node.body, new_scope, (child, scope) =>
        zoneBodyStatement(child, scope, digest, hoisting),
      );
      return {
        type: "binary-node",
        branch1: {
          type: "multi-node",
          branches: map(node.body, (child) =>
            zoneHoistNode(child, new_scope, digest, hoisting),
          ),
        },
        branch2: {
          type: "multi-node",
          branches,
        },
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").Class,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneClass = (node, scope, digest, hoisting) => ({
  type: "binary-node",
  branch1:
    node.superClass == null
      ? EMPTY_TREE
      : zoneExpression(node.superClass, scope, digest, hoisting),
  branch2: zoneClassBody(
    node.body,
    node.id == null ? scope : extendSingle(scope, node.id.name, "live"),
    digest,
    hoisting,
  ),
});

/**
 * @type {(
 *   node: import("../../estree").ClassBody,
 *   scope: import("./deadzone").DeadzoneScope,
 *   digest: import("../../hash").Digest,
 *   hoisting: import("./hoist-public").Hoisting,
 * ) => import("../../util/tree").Tree<
 *   import("./deadzone").DeadzoneEntry
 * >}
 */
const zoneClassBody = (node, scope, digest, hoisting) => ({
  type: "multi-node",
  branches: map(node.body, (child) =>
    zoneClassElement(child, scope, digest, hoisting),
  ),
});
