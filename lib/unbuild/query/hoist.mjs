/* eslint-disable no-use-before-define */

import { AranError, AranTypeError } from "../../error.mjs";
import { joinDeepPath, joinPath } from "../../path.mjs";
import {
  EMPTY,
  concatXX,
  concatXXX,
  every,
  filterNarrow,
  flatMap,
  flatMapIndex,
  hasOwn,
  map,
  mapIndex,
  some,
  someIndex,
} from "../../util/index.mjs";
import { listDeclaratorVariable, listPatternVariable } from "./pattern.mjs";
import { hasUseStrictDirective } from "./strict.mjs";

//////////
// util //
//////////

/**
 * @type {(
 *   node: import("../../estree").Node,
 * ) => node is import("../../estree").Identifier}
 */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   mode: import("./hoist-private").Mode,
 *   body: (
 *     | import("../../estree").Statement
 *     | import("../../estree").Directive
 *     | import("../../estree").ModuleDeclaration
 *   )[],
 * ) => import("./hoist-private").Mode}
 */
const updateMode = (mode, body) =>
  mode === "strict"
    ? "strict"
    : hasUseStrictDirective(body)
    ? "strict"
    : "sloppy";

//////////
// kind //
//////////

/**
 * @type {(
 *   kind: import("./hoist-private").Kind,
 * ) => boolean}
 */
const isKindDuplicable = (kind) => {
  switch (kind) {
    case "import": {
      return false;
    }
    case "var": {
      return true;
    }
    case "let": {
      return false;
    }
    case "const": {
      return false;
    }
    case "function-strict": {
      return true;
    }
    case "function-sloppy": {
      return true;
    }
    case "class": {
      return false;
    }
    case "param": {
      return false;
    }
    case "param-legacy": {
      return true;
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/////////////
// scoping //
/////////////

/** @type {import("./hoist-private").Scoping} */
const PARAM_SCOPING = {
  "param": true,
  "param-legacy": true,
};

/** @type {import("./hoist-private").Scoping} */
const CLOSURE_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": true,
  "class": true,
};

const MODULE_SCOPING = {
  "import": true,
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": true,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const BLOCK_SCOPING = {
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": false,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const SCRIPT_SCOPING = {};

/**
 * @type {(
 *   kind: "module" | "eval" | "script",
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Scoping}
 */
const getProgramScoping = (kind, mode) => {
  switch (kind) {
    case "module": {
      return MODULE_SCOPING;
    }
    case "script": {
      return SCRIPT_SCOPING;
    }
    case "eval": {
      switch (mode) {
        case "strict": {
          return CLOSURE_SCOPING;
        }
        case "sloppy": {
          return BLOCK_SCOPING;
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

//////////////
// accessor //
//////////////

/**
 * @type {import("./hoist-private").UnboundStatus}
 */
const UNBOUND_STATUS = {
  type: "unbound",
  backup: null,
};

/**
 * @type {import("./hoist-private").ReportStatus}
 */
const REPORT_STATUS = {
  type: "report",
};

/**
 * @type {(
 *   hoist: import("./hoist-private").Binding,
 * ) => hoist is import("./hoist-private").UnboundBinding}
 */
const isUnboundBinding = (hoist) => hoist.status.type === "unbound";

/**
 * @type {(
 *   hoist: import("./hoist-private").Binding,
 * ) => hoist is import("./hoist-private").BoundBinding}
 */
const isBoundBinding = (hoist) => hoist.status.type === "bound";

/**
 * @type {(
 *   hoist: import("./hoist-private").Binding,
 * ) => hoist is import("./hoist-private").ReportBinding}
 */
const isReportBinding = (hoist) => hoist.status.type === "report";

/**
 * @type {(
 *   hoist: import("./hoist-private").UnboundBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").UnboundBinding}
 */
const backupBinding = (hoist, path) => ({
  ...hoist,
  status: {
    type: "unbound",
    backup: path,
  },
});

/**
 * @type {(
 *   hoist: import("./hoist-private").UnboundBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").BoundBinding}
 */
const bindBinding = (hoist, path) => ({
  ...hoist,
  status: {
    type: "bound",
    path,
  },
});

/**
 * @type {(
 *   hoist: import("./hoist-private").UnboundBinding,
 * ) => import("./hoist-private").ReportBinding}
 */
const reportBinding = (hoist) => ({
  ...hoist,
  status: REPORT_STATUS,
});

/**
 * @type {(
 *   hoisting: import("./hoist-private").UnboundBinding[],
 * ) => import("./hoist-private").Binding[]}
 */
const reportDuplicate = (hoisting) =>
  mapIndex(hoisting.length, (index) => {
    const hoist = hoisting[index];
    if (hoist.kind === "function-sloppy") {
      if (
        some(
          hoisting,
          (other_hoist) =>
            other_hoist.variable === hoist.variable &&
            !isKindDuplicable(other_hoist.kind),
        )
      ) {
        if (hoist.status.backup === null) {
          return reportBinding(hoist);
        } else {
          return bindBinding(hoist, hoist.status.backup);
        }
      } else {
        return hoist;
      }
    } else if (
      !isKindDuplicable(hoist.kind) &&
      someIndex(
        hoisting.length,
        (other_index) =>
          index !== other_index &&
          hoist.variable === hoisting[other_index].variable,
      )
    ) {
      return reportBinding(hoist);
    } else {
      return hoist;
    }
  });

/**
 * @type {(
 *   scoping: import("./hoist-private").Scoping,
 *   hoist: import("./hoist-private").UnboundBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").Binding}
 */
const scopeBinding = (scoping, hoist, path) => {
  if (hasOwn(scoping, hoist.kind)) {
    if (scoping[hoist.kind]) {
      return bindBinding(hoist, path);
    } else {
      if (hoist.status.backup === null) {
        return backupBinding(hoist, path);
      } else {
        return hoist;
      }
    }
  } else {
    throw new AranError("out-of-scope kind", { scoping, hoist, path });
  }
};

/**
 * @type {(
 *   scoping: import("./hoist-private").Scoping,
 *   bindings: import("./hoist-private").Binding[],
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").Binding[]}
 */
const scopeBindingArray = (scoping, bindings, path) =>
  concatXXX(
    map(reportDuplicate(filterNarrow(bindings, isUnboundBinding)), (hoist) =>
      isUnboundBinding(hoist) ? scopeBinding(scoping, hoist, path) : hoist,
    ),
    filterNarrow(bindings, isBoundBinding),
    filterNarrow(bindings, isReportBinding),
  );

///////////
// hoist //
///////////

/**
 * @type {(
 *   node: import("../../estree").Program & {
 *     kind: "module" | "eval" | "script"
 *   },
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistProgram = (node, path, mode) => {
  const next_mode = updateMode(
    node.sourceType === "module" ? "strict" : mode,
    node.body,
  );
  return scopeBindingArray(
    getProgramScoping(node.kind, next_mode),
    flatMapIndex(node.body.length, (index) =>
      hoistProgramElement(
        node.body[index],
        joinDeepPath(path, "body", index),
        next_mode,
      ),
    ),
    path,
  );
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Expression
 *     | import("../../estree").Declaration
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistDefault = (node, path, mode) => {
  if (
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration" ||
    node.type === "VariableDeclaration"
  ) {
    return hoistStatement(node, path, mode);
  } else {
    return EMPTY;
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").ImportSpecifier
 *     | import("../../estree").ImportDefaultSpecifier
 *     | import("../../estree").ImportNamespaceSpecifier
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding}
 */
const hoistImportSpecifier = (node, path, _mode) => ({
  kind: "import",
  variable: /** @type {import("../../estree").Variable} */ (node.local.name),
  origin: path,
  status: UNBOUND_STATUS,
});

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Directive
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistProgramElement = (node, path, mode) => {
  if (node.type === "ImportDeclaration") {
    return mapIndex(node.specifiers.length, (index) =>
      hoistImportSpecifier(
        node.specifiers[index],
        joinDeepPath(path, "specifiers", index),
        mode,
      ),
    );
  } else if (node.type === "ExportDefaultDeclaration") {
    return hoistDefault(node.declaration, joinPath(path, "declaration"), mode);
  } else if (node.type === "ExportNamedDeclaration") {
    return node.declaration == null
      ? EMPTY
      : hoistStatement(node.declaration, joinPath(path, "declaration"), mode);
  } else if (node.type === "ExportAllDeclaration") {
    return EMPTY;
  } else {
    return hoistStatement(node, path, mode);
  }
};

/**
 * @type {(
 *   body: import("../../estree").Statement[],
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 *   scoping: import("./hoist-private").Scoping,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistBody = (body, path, mode, scoping) =>
  scopeBindingArray(
    scoping,
    flatMapIndex(body.length, (index) =>
      hoistStatement(body[index], joinPath(path, index), mode),
    ),
    path,
  );

/**
 * @type {(
 *   node: import("../../estree").Function,
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistClosure = (node, path, mode) => {
  /** @type {import("./hoist-private").Kind} */
  const kind =
    node.type !== "ArrowFunctionExpression" && every(node.params, isIdentifier)
      ? "param-legacy"
      : "param";
  return concatXX(
    scopeBindingArray(
      PARAM_SCOPING,
      map(flatMap(node.params, listPatternVariable), (variable) => ({
        kind,
        variable,
        origin: path,
        status: UNBOUND_STATUS,
      })),
      path,
    ),
    node.body.type === "BlockStatement"
      ? hoistBody(
          node.body.body,
          joinDeepPath(path, "body", "body"),
          mode,
          CLOSURE_SCOPING,
        )
      : EMPTY,
  );
};

/**
 * @type {(
 *   node: import("../../estree").CatchClause,
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistCatchClause = (node, path, mode) =>
  concatXX(
    node.param == null
      ? EMPTY
      : scopeBindingArray(
          PARAM_SCOPING,
          map(listPatternVariable(node.param), (variable) => ({
            kind: "param",
            variable,
            origin: path,
            status: UNBOUND_STATUS,
          })),
          path,
        ),
    hoistBody(
      node.body.body,
      joinDeepPath(path, "body", "body"),
      updateMode(mode, node.body.body),
      BLOCK_SCOPING,
    ),
  );

/**
 * @type {(
 *   node: import("../../estree").SwitchCase,
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistSwitchCase = (node, path, mode) =>
  flatMapIndex(node.consequent.length, (index) =>
    hoistStatement(
      node.consequent[index],
      joinDeepPath(path, "consequent", index),
      mode,
    ),
  );

/**
 * @type {(
 *   node: import("../../estree").Statement,
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistStatement = (node, path, mode) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return map(
        flatMap(node.declarations, listDeclaratorVariable),
        (variable) => ({
          kind: node.kind,
          variable,
          origin: path,
          status: UNBOUND_STATUS,
        }),
      );
    }
    case "ClassDeclaration": {
      return node.id == null
        ? EMPTY
        : [
            {
              kind: "class",
              variable: /** @type {import("../../estree").Variable} */ (
                node.id.name
              ),
              origin: path,
              status: UNBOUND_STATUS,
            },
          ];
    }
    case "FunctionDeclaration": {
      return node.id == null
        ? EMPTY
        : [
            {
              kind: `function-${updateMode(mode, node.body.body)}`,
              variable: /** @type {import("../../estree").Variable} */ (
                node.id.name
              ),
              origin: path,
              status: UNBOUND_STATUS,
            },
          ];
    }
    case "IfStatement": {
      return concatXX(
        hoistStatement(node.consequent, joinPath(path, "consequent"), mode),
        node.alternate == null
          ? EMPTY
          : hoistStatement(node.alternate, joinPath(path, "alternate"), mode),
      );
    }
    case "LabeledStatement": {
      return hoistStatement(node.body, joinPath(path, "body"), mode);
    }
    case "WhileStatement": {
      return hoistStatement(node.body, joinPath(path, "body"), mode);
    }
    case "DoWhileStatement": {
      return hoistStatement(node.body, joinPath(path, "body"), mode);
    }
    case "ForStatement": {
      if (node.init != null && node.init.type === "VariableDeclaration") {
        return scopeBindingArray(
          BLOCK_SCOPING,
          concatXX(
            hoistStatement(node.init, joinPath(path, "left"), mode),
            hoistStatement(node.body, joinPath(path, "body"), mode),
          ),
          path,
        );
      } else {
        return hoistStatement(node.body, joinPath(path, "body"), mode);
      }
    }
    case "ForInStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeBindingArray(
          BLOCK_SCOPING,
          concatXX(
            hoistStatement(node.left, joinPath(path, "left"), mode),
            hoistStatement(node.body, joinPath(path, "body"), mode),
          ),
          path,
        );
      } else {
        return hoistStatement(node.body, joinPath(path, "body"), mode);
      }
    }
    case "ForOfStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeBindingArray(
          BLOCK_SCOPING,
          concatXX(
            hoistStatement(node.left, joinPath(path, "left"), mode),
            hoistStatement(node.body, joinPath(path, "body"), mode),
          ),
          path,
        );
      } else {
        return hoistStatement(node.body, joinPath(path, "body"), mode);
      }
    }
    case "StaticBlock": {
      return hoistBody(
        node.body,
        joinPath(path, "body"),
        mode,
        CLOSURE_SCOPING,
      );
    }
    case "BlockStatement": {
      return hoistBody(node.body, joinPath(path, "body"), mode, BLOCK_SCOPING);
    }
    case "SwitchStatement": {
      return scopeBindingArray(
        BLOCK_SCOPING,
        flatMapIndex(node.cases.length, (index) =>
          hoistSwitchCase(
            node.cases[index],
            joinDeepPath(path, "cases", index),
            mode,
          ),
        ),
        path,
      );
    }
    case "TryStatement": {
      return concatXXX(
        hoistStatement(node.block, joinPath(path, "block"), mode),
        node.handler == null
          ? EMPTY
          : hoistCatchClause(node.handler, joinPath(path, "handler"), mode),
        node.finalizer == null
          ? EMPTY
          : hoistStatement(node.finalizer, joinPath(path, "finalizer"), mode),
      );
    }
    case "WithStatement": {
      return hoistStatement(node.body, joinPath(path, "body"), mode);
    }
    case "ThrowStatement": {
      return EMPTY;
    }
    case "ExpressionStatement": {
      return EMPTY;
    }
    case "ReturnStatement": {
      return EMPTY;
    }
    case "ContinueStatement": {
      return EMPTY;
    }
    case "BreakStatement": {
      return EMPTY;
    }
    case "EmptyStatement": {
      return EMPTY;
    }
    case "DebuggerStatement": {
      return EMPTY;
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

////////////
// export //
////////////

/**
 * @type {(
 *   kind: import("./hoist-private").Kind,
 * ) => import("./hoist-public").Write}
 */
const getKindWrite = (kind) => {
  switch (kind) {
    case "import": {
      return "report";
    }
    case "var": {
      return "perform";
    }
    case "let": {
      return "perform";
    }
    case "const": {
      return "report";
    }
    case "function-strict": {
      return "perform";
    }
    case "function-sloppy": {
      return "perform";
    }
    case "class": {
      return "perform";
    }
    case "param": {
      return "perform";
    }
    case "param-legacy": {
      return "perform";
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/**
 * @type {(
 *   kind: import("./hoist-private").Kind,
 * ) => import("./hoist-public").Baseline}
 */
const getKindBaseline = (kind) => {
  switch (kind) {
    case "import": {
      return "import";
    }
    case "var": {
      return "undefined";
    }
    case "let": {
      return "deadzone";
    }
    case "const": {
      return "deadzone";
    }
    case "function-strict": {
      return "undefined";
    }
    case "function-sloppy": {
      return "undefined";
    }
    case "class": {
      return "deadzone";
    }
    case "param": {
      return "deadzone";
    }
    case "param-legacy": {
      return "undefined";
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/**
 * @type {(
 *   hoist: import("./hoist-private").Binding,
 * ) => import("./hoist-public").Duplicate}
 */
const toDuplicate = ({ variable, origin }) => ({ variable, origin });

/**
 * @type {(
 *   bindings: import("./hoist-public").Binding[],
 *   variable: import("../../estree").Variable,
 * ) => boolean}
 */
const hasVariable = (bindings, variable) => {
  for (const { variable: other_variable } of bindings) {
    if (variable === other_variable) {
      return true;
    }
  }
  return false;
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").ImportSpecifier
 *     | import("../../estree").ImportDefaultSpecifier
 *     | import("../../estree").ImportNamespaceSpecifier
 *   ),
 * ) => import("../../estree").Specifier | null}
 */
const getImportSpecifier = (node) => {
  switch (node.type) {
    case "ImportSpecifier": {
      return /** @type {import("../../estree").Specifier} */ (
        node.imported.name
      );
    }
    case "ImportDefaultSpecifier": {
      return /** @type {import("../../estree").Specifier} */ ("default");
    }
    case "ImportNamespaceSpecifier": {
      return null;
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   body: import("../../estree").ImportDeclaration[],
 *   variable: import("../../estree").Variable,
 * ) => {
 *   source: import("../../estree").Source,
 *   specifier: import("../../estree").Specifier | null,
 * }}
 */
const fetchImport = (body, variable) => {
  for (const node of body) {
    for (const child of node.specifiers) {
      if (child.local.name === variable) {
        return {
          source: /** @type {import("../../estree").Source} */ (
            node.source.value
          ),
          specifier: getImportSpecifier(child),
        };
      }
    }
  }
  throw new AranError("missing external binding", { variable, body });
};

/**
 * @type {(
 *   hoist: import("./hoist-private").Binding,
 *   body: import("../../estree").ImportDeclaration[],
 * ) => import("./hoist-public").Binding}
 */
const toPublicBinding = ({ kind, variable }, body) => {
  const baseline = getKindBaseline(kind);
  if (baseline === "import") {
    return {
      baseline,
      variable,
      write: "report",
      import: fetchImport(body, variable),
    };
  } else if (baseline === "deadzone" || baseline === "undefined") {
    return {
      baseline,
      variable,
      write: getKindWrite(kind),
      import: null,
    };
  } else {
    throw new AranTypeError(baseline);
  }
};

/**
 * @type {(
 *   node: import("../../estree").Node,
 * ) => node is import("../../estree").ImportDeclaration}
 */
const isImportDeclaration = (node) => node.type === "ImportDeclaration";

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Program & {
 *       kind: "module" | "eval" | "script"
 *     }
 *     | import("../../estree").Function
 *     | import("../../estree").StaticBlock
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistRoot = (node, path, mode) => {
  if (node.type === "Program") {
    return hoistProgram(node, path, mode);
  } else if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return hoistClosure(node, path, mode);
  } else if (node.type === "StaticBlock") {
    return hoistStatement(node, path, mode);
  } else {
    throw new AranTypeError(node);
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: (
 *     | import("../../estree").Program & {
 *       kind: "module" | "eval" | "script"
 *     }
 *     | import("../../estree").Function
 *     | import("../../estree").StaticBlock
 *   ),
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => {
 *   report: import("./hoist-public").Duplicate[],
 *   unbound: import("./hoist-public").Binding[],
 *   hoisting: import("./hoist-public").Hoisting,
 * }}
 */
export const hoist = (node, path, mode) => {
  const bindings = hoistRoot(node, path, mode);
  /** @type {import("./hoist-public").Binding[]} */
  const unbound = [];
  /** @type {import("./hoist-public").Hoisting} */
  const hoisting = /** @type {any} */ ({ __proto__: null });
  /** @type {import("./hoist-public").Duplicate[]} */
  const report = [];
  /** @type {import("../../estree").ImportDeclaration[]} */
  const body =
    node.type === "Program" && node.sourceType === "module"
      ? filterNarrow(node.body, isImportDeclaration)
      : EMPTY;
  for (const binding of bindings) {
    if (binding.status.type === "unbound") {
      if (!hasVariable(unbound, binding.variable)) {
        unbound[unbound.length] = toPublicBinding(binding, body);
      }
    } else if (binding.status.type === "bound") {
      if (hasOwn(hoisting, binding.status.path)) {
        const bindings = hoisting[binding.status.path];
        if (!hasVariable(bindings, binding.variable)) {
          bindings[bindings.length] = toPublicBinding(binding, body);
        }
      } else {
        hoisting[binding.status.path] = [toPublicBinding(binding, body)];
      }
    } else if (binding.status.type === "report") {
      report[report.length] = toDuplicate(binding);
    } else {
      throw new AranTypeError(binding.status);
    }
  }
  return { report, unbound, hoisting };
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   registery: import("./hoist-public").Hoisting,
 *   path: import("../../path").Path,
 * ) => import("./hoist-public").Binding[]}
 */
export const listBinding = (registery, path) =>
  hasOwn(registery, path) ? registery[path] : EMPTY;
