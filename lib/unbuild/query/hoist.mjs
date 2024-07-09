/* eslint-disable no-use-before-define */

import { AranError, AranTypeError } from "../../error.mjs";
import { joinDeepPath, joinPath, joinVeryDeepPath } from "../../path.mjs";
import {
  EMPTY,
  concatXX,
  concatXXX,
  every,
  filterNarrow,
  filterOut,
  flatMap,
  flatMapIndex,
  hasOwn,
  map,
  mapIndex,
  reduceIndex,
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
 *   other_kind: import("./hoist-private").Kind,
 * ) => import("./hoist-private").Clash}
 */
const getKindClash = (kind, other_kind) => {
  if (kind === "function-sloppy-away") {
    if (
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "import" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class"
    ) {
      return "remove";
    } else if (
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away" ||
      other_kind === "error"
    ) {
      return "ignore";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (kind === "function-sloppy-near") {
    if (
      other_kind === "import" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "error"
    ) {
      return "report";
    } else if (
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away"
    ) {
      return "ignore";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (
    kind === "let" ||
    kind === "const" ||
    kind === "class" ||
    kind === "import"
  ) {
    if (other_kind === "function-sloppy-away") {
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
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (kind === "error") {
    if (other_kind === "var" || other_kind === "function-sloppy-away") {
      return "ignore";
    } else if (
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import" ||
      other_kind === "error" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (kind === "var") {
    if (
      other_kind === "var" ||
      other_kind === "error" ||
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away"
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
  } else if (kind === "function-strict") {
    if (
      other_kind === "var" ||
      other_kind === "param" ||
      other_kind === "param-legacy" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away"
    ) {
      return "ignore";
    } else if (
      other_kind === "error" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (kind === "param" || kind === "param-legacy") {
    if (
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away" ||
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
  } else {
    throw new AranTypeError(kind);
  }
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
  "function-sloppy-near": true,
  "function-sloppy-away": true,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const SCRIPT_SCOPING = {
  "var": false,
  "let": false,
  "const": false,
  "function-strict": false,
  "function-sloppy-near": false,
  "function-sloppy-away": false,
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
  "function-sloppy-near": true,
  "function-sloppy-away": false,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const STRICT_EVAL_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": true,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const CATCH_HEAD_SCOPING = {
  "error": true,
  "var": false,
  "function-sloppy-away": false,
};

/** @type {import("./hoist-private").Scoping} */
const CATCH_BODY_SCOPING = {
  "error": false,
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": false,
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
  "function-sloppy-near": true,
  "function-sloppy-away": true,
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
  "function-sloppy-near": true,
  "function-sloppy-away": false,
  "class": true,
};

/** @type {import("./hoist-private").Scoping} */
const STATIC_BLOCK_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": true,
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
 * ) => binding is import("./hoist-private").FreeBinding}
 */
const isFreeBinding = (binding) => binding.type === "free";

/**
 * @type {(
 *   binding: import("./hoist-private").Binding,
 * ) => binding is (
 *   | import("./hoist-private").LockBinding
 *   | import("./hoist-private").FlagBinding
 *   | import("./hoist-private").VoidBinding
 * )}
 */
const isNotFreeBinding = (binding) =>
  binding.type === "lock" || binding.type === "flag" || binding.type === "void";

// /**
//  * @type {(
//  *   binding: import("./hoist-private").Binding,
//  * ) => binding is import("./hoist-private").LockBinding}
//  */
// const isLockBinding = (binding) => binding.type === "lock";

// /**
//  * @type {(
//  *   binding: import("./hoist-private").Binding,
//  * ) => binding is import("./hoist-private").FlagBinding}
//  */
// const isFlagBinding = (binding) => binding.type === "flag";

// /**
//  * @type {(
//  *   binding: import("./hoist-private").Binding,
//  * ) => binding is import("./hoist-private").VoidBinding}
//  */
// const isVoidBinding = (binding) => binding.type === "void";

/**
 * @type {(
 *   binding: import("./hoist-private").Binding,
 * ) => boolean}
 */
const isFreeBlockSloppyFunctionBinding = (binding) =>
  binding.type === "free" && binding.kind === "function-sloppy-near";

/**
 * @type {(
 *   hoist: import("./hoist-private").FreeBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").LockBinding}
 */
const lockupBinding = (binding, path) => ({
  ...binding,
  type: "lock",
  bind: path,
});

/**
 * @type {(
 *   hoist: import("./hoist-private").FreeBinding,
 * ) => import("./hoist-private").FlagBinding}
 */
const reportBinding = (binding) => ({
  ...binding,
  type: "flag",
  bind: null,
});

/**
 * @type {(
 *   hoist: import("./hoist-private").FreeBinding,
 * ) => import("./hoist-private").VoidBinding}
 */
const removeBinding = (binding) => ({
  ...binding,
  type: "void",
  bind: null,
});

/**
 * @type {(
 *   accumulation: import("./hoist-private").DuplicateAccumulation,
 *   index: number,
 * ) => import("./hoist-private").DuplicateAccumulation}
 */
const accumulateDuplicate = (accumulation, index) => {
  if (
    accumulation.binding.type === "lock" ||
    accumulation.binding.type === "flag" ||
    accumulation.binding.type === "void"
  ) {
    return accumulation;
  } else if (accumulation.binding.type === "free") {
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
        case "remove": {
          return {
            ...accumulation,
            binding: removeBinding(accumulation.binding),
          };
        }
        default: {
          throw new AranTypeError(clash);
        }
      }
    }
  } else {
    throw new AranTypeError(accumulation.binding);
  }
};

/**
 * @type {(
 *   bindings: import("./hoist-private").FreeBinding[],
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
 *   binding: import("./hoist-private").FreeBinding,
 *   path: import("../../path").Path,
 * ) => import("./hoist-private").Binding}
 */
const scopeBinding = (scoping, binding, path) => {
  if (hasOwn(scoping, binding.kind)) {
    if (scoping[binding.kind]) {
      return lockupBinding(binding, path);
    } else {
      return binding;
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
  concatXX(
    map(
      reportDuplicate(filterNarrow(bindings, isFreeBinding), path),
      (hoist) =>
        isFreeBinding(hoist) ? scopeBinding(scoping, hoist, path) : hoist,
    ),
    filterNarrow(bindings, isNotFreeBinding),
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
  type: "free",
  kind: "import",
  variable: /** @type {import("../../estree").Variable} */ (node.local.name),
  origin: path,
  bind: null,
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
            type: "free",
            kind,
            variable,
            origin: path,
            bind: null,
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
        type: "free",
        kind,
        variable,
        origin: path,
        bind: null,
      })),
      path,
    );
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
              type: "free",
              kind: "error",
              variable,
              origin: path,
              bind: null,
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
          type: "free",
          kind: node.kind,
          variable,
          origin: path,
          bind: null,
        }),
      );
    }
    case "ClassDeclaration": {
      return node.id == null
        ? EMPTY
        : [
            {
              type: "free",
              kind: "class",
              variable: /** @type {import("../../estree").Variable} */ (
                node.id.name
              ),
              origin: path,
              bind: null,
            },
          ];
    }
    case "FunctionDeclaration": {
      if (node.id == null) {
        return EMPTY;
      } else {
        const variable = /** @type {import("../../estree").Variable} */ (
          node.id.name
        );
        switch (mode) {
          case "strict": {
            return [
              {
                type: "free",
                kind: "function-strict",
                variable,
                origin: path,
                bind: null,
              },
            ];
          }
          case "sloppy": {
            return [
              {
                type: "free",
                kind: "function-sloppy-near",
                variable,
                origin: path,
                bind: null,
              },
              {
                type: "free",
                kind: "function-sloppy-away",
                variable,
                origin: path,
                bind: null,
              },
            ];
          }
          default: {
            throw new AranTypeError(mode);
          }
        }
      }
    }
    case "IfStatement": {
      return filterOut(
        concatXX(
          hoistStatement(node.consequent, joinPath(path, "consequent"), mode),
          node.alternate == null
            ? EMPTY
            : hoistStatement(node.alternate, joinPath(path, "alternate"), mode),
        ),
        isFreeBlockSloppyFunctionBinding,
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

/** @type {import("./hoist-public").SloppyFunction} */
const PASS_SLOPPY_FUNCTION = { near: 0, away: 0 };

/** @type {import("./hoist-public").SloppyFunction} */
const NEAR_SLOPPY_FUNCTION = { near: 1, away: 0 };

/** @type {import("./hoist-public").SloppyFunction} */
const AWAY_SLOPPY_FUNCTION = { near: 0, away: 1 };

/**
 * @type {(
 *   kind: import("./hoist-private").Kind,
 * ) => "perform" | "report"}
 */
const getRegularWrite = (kind) => {
  if (kind === "const" || kind === "import") {
    return "report";
  } else if (
    kind === "var" ||
    kind === "let" ||
    kind === "class" ||
    kind === "function-strict" ||
    kind === "param" ||
    kind === "param-legacy" ||
    kind === "error" ||
    kind === "function-sloppy-near" ||
    kind === "function-sloppy-away"
  ) {
    return "perform";
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   kind: import("./hoist-private").Kind,
 * ) => "live" | "dead"}
 */
const getRegularBaseline = (kind) => {
  if (
    kind === "let" ||
    kind === "const" ||
    kind === "class" ||
    kind === "error" ||
    kind === "param"
  ) {
    return "dead";
  } else if (
    kind === "import" ||
    kind === "var" ||
    kind === "param-legacy" ||
    kind === "function-strict" ||
    kind === "function-sloppy-near" ||
    kind === "function-sloppy-away"
  ) {
    return "live";
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   kind: import("./hoist-private").Kind,
 * ) => import("./hoist-public").SloppyFunction}
 */
const getSloppyFunction = (kind) => {
  if (kind === "function-sloppy-away") {
    return AWAY_SLOPPY_FUNCTION;
  } else if (kind === "function-sloppy-near") {
    return NEAR_SLOPPY_FUNCTION;
  } else if (kind === "error" || kind === "var" || kind === "function-strict") {
    return PASS_SLOPPY_FUNCTION;
  } else if (
    kind === "let" ||
    kind === "const" ||
    kind === "class" ||
    kind === "param" ||
    kind === "param-legacy" ||
    kind === "import"
  ) {
    return null;
  } else {
    throw new AranTypeError(kind);
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
 *   binding: (
 *     | import("./hoist-private").FreeBinding
 *     | import("./hoist-private").LockBinding
 *   ),
 *   bindings: import("./hoist-private").Binding[],
 * ) => import("./hoist-public").Binding}
 */
const toPublicBinding = (binding) => ({
  variable: binding.variable,
  write: getRegularWrite(binding.kind),
  baseline: getRegularBaseline(binding.kind),
  sloppy_function: getSloppyFunction(binding.kind),
});

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

/**
 * @type {(
 *   sloppy_function_1: import("./hoist-public").SloppyFunction,
 *   sloppy_function_2: import("./hoist-public").SloppyFunction,
 * ) => import("./hoist-public").SloppyFunction}
 */
const mergeSloppyFunction = (sloppy_function_1, sloppy_function_2) => {
  if (sloppy_function_1 === null || sloppy_function_2 === null) {
    return null;
  } else {
    return {
      near: sloppy_function_1.near + sloppy_function_2.near,
      away: sloppy_function_1.away + sloppy_function_2.away,
    };
  }
};

/**
 * @type {(
 *   binding1: import("./hoist-public").Binding,
 *   binding2: import("./hoist-public").Binding,
 * ) => import("./hoist-public").Binding}
 */
const mergeBinding = (binding1, binding2) => {
  if (
    binding1.variable === binding2.variable &&
    binding1.baseline === binding2.baseline &&
    binding1.write === binding2.write
  ) {
    return {
      ...binding1,
      sloppy_function: mergeSloppyFunction(
        binding1.sloppy_function,
        binding2.sloppy_function,
      ),
    };
  } else {
    throw new AranError("incompatible binding", { binding1, binding2 });
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
  for (const binding of bindings) {
    if (binding.type === "flag") {
      report[report.length] = toDuplicate(binding);
    } else if (binding.type === "void") {
      // noop
    } else if (binding.type === "free" || binding.type === "lock") {
      let frame = unbound;
      if (binding.type === "lock") {
        if (hasOwn(hoisting, binding.bind)) {
          frame = hoisting[binding.bind];
        } else {
          frame = [];
          hoisting[binding.bind] = frame;
        }
      }
      const { length } = frame;
      let merged = false;
      for (let index = 0; index < length; index += 1) {
        const other = frame[index];
        if (binding.variable === other.variable) {
          frame[index] = mergeBinding(
            toPublicBinding(binding, bindings),
            other,
          );
          merged = true;
          index = length;
        }
      }
      if (!merged) {
        frame[length] = toPublicBinding(binding, bindings);
      }
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
