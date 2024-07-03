/* eslint-disable no-use-before-define */

import { AranError, AranTypeError } from "../../error.mjs";
import { joinDeepPath, joinPath, joinVeryDeepPath } from "../../path.mjs";
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
  reduceIndex,
} from "../../util/index.mjs";
import { listDeclaratorVariable, listPatternVariable } from "./pattern.mjs";
import { getSource } from "./source.mjs";
import { DEFAULT_SPECIFIER, getSpecifier } from "./specifier.mjs";
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
 *   other_kind: import("./hoist-private").Kind,
 * ) => import("./hoist-private").Clash}
 */
const getKindClash = (kind, other_kind) => {
  if (kind === "function-sloppy") {
    if (other_kind === "param" || other_kind === "param-legacy") {
      return "backup";
    } else if (
      other_kind === "import" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "error"
    ) {
      return "backup-from-deep";
    } else if (
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy"
    ) {
      return "ignore";
    } else {
      throw new AranTypeError(other_kind);
    }
  }
  if (kind === "function-strict") {
    if (
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy"
    ) {
      return "ignore";
    } else if (
      other_kind === "import" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "error"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  }
  if (
    kind === "let" ||
    kind === "const" ||
    kind === "class" ||
    kind === "import"
  ) {
    if (other_kind === "function-sloppy") {
      return "ignore";
    } else if (
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import" ||
      other_kind === "error" ||
      other_kind === "var" ||
      other_kind === "function-strict"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  }
  if (kind === "error") {
    if (other_kind === "var" || other_kind === "function-sloppy") {
      return "ignore";
    } else if (
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import" ||
      other_kind === "error" ||
      other_kind === "function-strict"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  }
  if (kind === "var") {
    if (
      other_kind === "var" ||
      other_kind === "error" ||
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy"
    ) {
      return "ignore";
    } else if (
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  }
  if (kind === "param" || kind === "param-legacy") {
    if (
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy" ||
      other_kind === "param-legacy"
    ) {
      return "ignore";
    } else if (
      other_kind === "param" ||
      other_kind === "import" ||
      other_kind === "error" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  }
  throw new AranTypeError(kind);
};

/////////////
// scoping //
/////////////

/** @type {import("./hoist-private").Scoping} */
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
const SCRIPT_SCOPING = {
  "var": false,
  "let": false,
  "const": false,
  "function-strict": false,
  "function-sloppy": false,
  "class": false,
};

// Normally sloppy functions should be scoped to the surrounding closure if they
// do not clash. This has not been implemented and the sloppy function will be
// scoped to the program instead.
//
// cf: ./doc/issue/eval-function-declaration.md
/** @type {import("./hoist-private").Scoping} */
const SLOPPY_EVAL_SCOPING = {
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": true,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const STRICT_EVAL_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": true,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const CATCH_HEAD_SCOPING = {
  "error": true,
  "var": false,
  "function-sloppy": false,
};

/** @type {import("./hoist-private").Scoping} */
const CATCH_BODY_SCOPING = {
  "error": false,
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": false,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const CLOSURE_BODY_SCOPING = {
  "param": false,
  "param-legacy": false,
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": true,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const CLOSURE_HEAD_SCOPING = {
  "param": true,
  "param-legacy": true,
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
const STATIC_BLOCK_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy": true,
  "class": true,
};

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
          return STRICT_EVAL_SCOPING;
        }
        case "sloppy": {
          return SLOPPY_EVAL_SCOPING;
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
 * @type {(
 *   binding: import("./hoist-private").Binding,
 * ) => binding is import("./hoist-private").UnboundBinding}
 */
const isUnboundBinding = (binding) => binding.type === "unbound";

/**
 * @type {(
 *   binding: import("./hoist-private").Binding,
 * ) => binding is import("./hoist-private").BoundBinding}
 */
const isBoundBinding = (binding) => binding.type === "bound";

/**
 * @type {(
 *   binding: import("./hoist-private").Binding,
 * ) => binding is import("./hoist-private").ReportBinding}
 */
const isReportBinding = (binding) => binding.type === "report";

/**
 * @type {(
 *   hoist: import("./hoist-private").UnboundBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").UnboundBinding}
 */
const backupBinding = (hoist, path) => ({
  ...hoist,
  backup: path,
});

/**
 * @type {(
 *   hoist: import("./hoist-private").UnboundBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").BoundBinding}
 */
const bindBinding = (binding, path) => ({
  ...binding,
  type: "bound",
  bind: path,
  backup: null,
});

/**
 * @type {(
 *   hoist: import("./hoist-private").UnboundBinding,
 * ) => import("./hoist-private").ReportBinding}
 */
const reportBinding = (binding) => ({
  ...binding,
  type: "report",
  bind: null,
  backup: null,
});

/**
 * @type {(
 *   accumulation: import("./hoist-private").DuplicateAccumulation,
 *   index: number,
 * ) => import("./hoist-private").DuplicateAccumulation}
 */
const accumulateDuplicate = (accumulation, index) => {
  switch (accumulation.binding.type) {
    case "bound": {
      return accumulation;
    }
    case "report": {
      return accumulation;
    }
    case "unbound": {
      if (
        accumulation.index === index ||
        accumulation.binding.variable !== accumulation.bindings[index].variable
      ) {
        return accumulation;
      } else {
        const clash = getKindClash(
          accumulation.binding.kind,
          accumulation.bindings[index].kind,
        );
        switch (clash) {
          case "ignore": {
            return accumulation;
          }
          case "report": {
            return {
              ...accumulation,
              binding: reportBinding(accumulation.binding),
            };
          }
          case "backup": {
            return {
              ...accumulation,
              binding: bindBinding(
                accumulation.binding,
                accumulation.binding.backup ?? accumulation.current,
              ),
            };
          }
          case "backup-from-deep": {
            return {
              ...accumulation,
              binding:
                accumulation.binding.backup === null
                  ? reportBinding(accumulation.binding)
                  : bindBinding(
                      accumulation.binding,
                      accumulation.binding.backup,
                    ),
            };
          }
          default: {
            throw new AranTypeError(clash);
          }
        }
      }
    }
    default: {
      throw new AranTypeError(accumulation.binding);
    }
  }
};

/**
 * @type {(
 *   bindings: import("./hoist-private").UnboundBinding[],
 *   current: import("../../path").Path,
 * ) => import("./hoist-private").Binding[]}
 */
const reportDuplicate = (bindings, current) => {
  const { length } = bindings;
  return mapIndex(
    length,
    (index) =>
      reduceIndex(length, accumulateDuplicate, {
        index,
        binding: bindings[index],
        bindings,
        current,
      }).binding,
  );
};

/**
 * @type {(
 *   scoping: import("./hoist-private").Scoping,
 *   binding: import("./hoist-private").UnboundBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").Binding}
 */
const scopeBinding = (scoping, binding, path) => {
  if (hasOwn(scoping, binding.kind)) {
    if (scoping[binding.kind]) {
      return bindBinding(binding, path);
    } else {
      if (binding.backup === null) {
        return backupBinding(binding, path);
      } else {
        return binding;
      }
    }
  } else {
    throw new AranError("out-of-scope kind", { scoping, binding, path });
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
    map(
      reportDuplicate(filterNarrow(bindings, isUnboundBinding), path),
      (hoist) =>
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
  type: "unbound",
  kind: "import",
  variable: /** @type {import("../../estree").Variable} */ (node.local.name),
  origin: path,
  bind: null,
  backup: null,
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
  if (node.body.type === "BlockStatement") {
    const kind =
      node.type !== "ArrowFunctionExpression" &&
      every(node.params, isIdentifier)
        ? "param-legacy"
        : "param";
    return scopeBindingArray(
      CLOSURE_HEAD_SCOPING,
      scopeBindingArray(
        CLOSURE_BODY_SCOPING,
        concatXX(
          map(flatMap(node.params, listPatternVariable), (variable) => ({
            type: "unbound",
            kind,
            variable,
            origin: path,
            bind: null,
            backup: null,
          })),
          flatMapIndex(node.body.body.length, (index) =>
            hoistStatement(
              /** @type {import("../../estree").BlockStatement} */ (node.body)
                .body[index],
              joinVeryDeepPath(path, "body", "body", index),
              mode,
            ),
          ),
        ),
        joinPath(path, "body"),
      ),
      path,
    );
  } else {
    return scopeBindingArray(
      CLOSURE_HEAD_SCOPING,
      map(flatMap(node.params, listPatternVariable), (variable) => ({
        type: "unbound",
        kind,
        variable,
        origin: path,
        bind: null,
        backup: null,
      })),
      path,
    );
  }
};

/**
 * @type {(
 *   binding: import("./hoist-private").Binding,
 *   path: import("../../path").Path,
 *   segment: "consequent" | "alternate",
 * ) => import("./hoist-private").Binding}
 */
const backupSloppyFunction = (binding, path, segment) => {
  if (
    binding.type === "unbound" &&
    binding.backup === null &&
    binding.kind === "function-sloppy"
  ) {
    return backupBinding(binding, joinPath(path, segment));
  } else {
    return binding;
  }
};

/**
 * @type {(
 *   node: import("../../estree").CatchClause,
 *   path: import("../../path").Path,
 *   mode: import("./hoist-private").Mode,
 * ) => import("./hoist-private").Binding[]}
 */
const hoistCatchClause = (node, path, mode) =>
  scopeBindingArray(
    CATCH_HEAD_SCOPING,
    scopeBindingArray(
      CATCH_BODY_SCOPING,
      concatXX(
        node.param == null
          ? EMPTY
          : map(listPatternVariable(node.param), (variable) => ({
              type: "unbound",
              kind: "error",
              variable,
              origin: path,
              bind: null,
              backup: null,
            })),
        flatMapIndex(node.body.body.length, (index) =>
          hoistStatement(
            node.body.body[index],
            joinVeryDeepPath(path, "body", "body", index),
            mode,
          ),
        ),
      ),
      joinPath(path, "body"),
    ),
    path,
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
          type: "unbound",
          kind: node.kind,
          variable,
          origin: path,
          bind: null,
          backup: null,
        }),
      );
    }
    case "ClassDeclaration": {
      return node.id == null
        ? EMPTY
        : [
            {
              type: "unbound",
              kind: "class",
              variable: /** @type {import("../../estree").Variable} */ (
                node.id.name
              ),
              origin: path,
              bind: null,
              backup: null,
            },
          ];
    }
    case "FunctionDeclaration": {
      return node.id == null
        ? EMPTY
        : [
            {
              type: "unbound",
              kind: `function-${updateMode(mode, node.body.body)}`,
              variable: /** @type {import("../../estree").Variable} */ (
                node.id.name
              ),
              origin: path,
              bind: null,
              backup: null,
            },
          ];
    }
    case "IfStatement": {
      return concatXX(
        map(
          hoistStatement(node.consequent, joinPath(path, "consequent"), mode),
          (binding) => backupSloppyFunction(binding, path, "consequent"),
        ),
        map(
          node.alternate == null
            ? EMPTY
            : hoistStatement(node.alternate, joinPath(path, "alternate"), mode),
          (binding) => backupSloppyFunction(binding, path, "alternate"),
        ),
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
            hoistStatement(node.init, joinPath(path, "init"), mode),
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
      return scopeBindingArray(
        STATIC_BLOCK_SCOPING,
        flatMapIndex(node.body.length, (index) =>
          hoistStatement(
            node.body[index],
            joinDeepPath(path, "body", index),
            mode,
          ),
        ),
        path,
      );
    }
    case "BlockStatement": {
      return scopeBindingArray(
        BLOCK_SCOPING,
        flatMapIndex(node.body.length, (index) =>
          hoistStatement(
            node.body[index],
            joinDeepPath(path, "body", index),
            mode,
          ),
        ),
        path,
      );
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
    case "error": {
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
    case "error": {
      return "deadzone";
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
      return getSpecifier(node.imported);
    }
    case "ImportDefaultSpecifier": {
      return DEFAULT_SPECIFIER;
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
          source: getSource(node.source),
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
    if (binding.type === "unbound") {
      if (!hasVariable(unbound, binding.variable)) {
        unbound[unbound.length] = toPublicBinding(binding, body);
      }
    } else if (binding.type === "bound") {
      if (hasOwn(hoisting, binding.bind)) {
        const bindings = hoisting[binding.bind];
        if (!hasVariable(bindings, binding.variable)) {
          bindings[bindings.length] = toPublicBinding(binding, body);
        }
      } else {
        hoisting[binding.bind] = [toPublicBinding(binding, body)];
      }
    } else if (binding.type === "report") {
      report[report.length] = toDuplicate(binding);
    } else {
      throw new AranTypeError(binding);
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
