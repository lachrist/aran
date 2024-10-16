/* eslint-disable no-use-before-define */

import { AranExecError, AranTypeError } from "../../error.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "estree-sentry";
import {
  EMPTY,
  everyNarrow,
  filterNarrowTree,
  hasOwn,
  map,
  mapIndex,
  mapTree,
  reduceIndex,
} from "../../util/index.mjs";
import { hasUseStrictDirective } from "../query/index.mjs";

//////////
// util //
//////////

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").VariableIdentifier<import("../../hash").HashProp>}
 */
const isVariableIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   mode: import("../mode").Mode,
 *   body: (
 *     | import("estree-sentry").Statement<import("../../hash").HashProp>
 *     | import("estree-sentry").ModuleDeclaration<import("../../hash").HashProp>
 *   )[],
 * ) => import("../mode").Mode}
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
 *   kind: import("./hoisting-private").Kind,
 *   other_kind: import("./hoisting-private").Kind,
 * ) => import("./hoisting-private").Clash}
 */
const getKindClash = (kind, other_kind) => {
  if (
    kind === "arguments" ||
    kind === "function-self-sloppy" ||
    kind === "function-self-strict" ||
    kind === "class-self"
  ) {
    return "remove";
  } else if (kind === "function-sloppy-away") {
    if (
      other_kind === "param" ||
      other_kind === "param-simple" ||
      other_kind === "import" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "error"
    ) {
      return "remove";
    } else if (
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away" ||
      other_kind === "error-simple" ||
      other_kind === "function-self-sloppy" ||
      other_kind === "function-self-strict" ||
      other_kind === "class-self" ||
      other_kind === "arguments"
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
      other_kind === "error" ||
      other_kind === "error-simple"
    ) {
      return "report";
    } else if (
      other_kind === "param" ||
      other_kind === "param-simple" ||
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away" ||
      other_kind === "function-self-sloppy" ||
      other_kind === "function-self-strict" ||
      other_kind === "class-self" ||
      other_kind === "arguments"
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
    if (
      other_kind === "function-sloppy-away" ||
      other_kind === "function-self-sloppy" ||
      other_kind === "function-self-strict" ||
      other_kind === "class-self" ||
      other_kind === "arguments"
    ) {
      return "ignore";
    } else if (
      other_kind === "param" ||
      other_kind === "param-simple" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import" ||
      other_kind === "error" ||
      other_kind === "error-simple" ||
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (kind === "error" || kind === "error-simple") {
    if (
      other_kind === "var" ||
      other_kind === "function-sloppy-away" ||
      other_kind === "function-self-sloppy" ||
      other_kind === "function-self-strict" ||
      other_kind === "class-self" ||
      other_kind === "arguments"
    ) {
      return "ignore";
    } else if (
      other_kind === "param" ||
      other_kind === "param-simple" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import" ||
      other_kind === "error" ||
      other_kind === "error-simple" ||
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
      other_kind === "error-simple" ||
      other_kind === "param" ||
      other_kind === "param-simple" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away" ||
      other_kind === "function-self-sloppy" ||
      other_kind === "function-self-strict" ||
      other_kind === "class-self" ||
      other_kind === "arguments"
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
      other_kind === "param-simple" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away" ||
      other_kind === "function-self-sloppy" ||
      other_kind === "function-self-strict" ||
      other_kind === "class-self" ||
      other_kind === "arguments"
    ) {
      return "ignore";
    } else if (
      other_kind === "error" ||
      other_kind === "error-simple" ||
      other_kind === "let" ||
      other_kind === "const" ||
      other_kind === "class" ||
      other_kind === "import"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (kind === "param" || kind === "param-simple") {
    if (
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near" ||
      other_kind === "function-sloppy-away" ||
      other_kind === "param-simple" ||
      other_kind === "function-self-sloppy" ||
      other_kind === "function-self-strict" ||
      other_kind === "class-self" ||
      other_kind === "arguments"
    ) {
      return "ignore";
    } else if (
      other_kind === "param" ||
      other_kind === "import" ||
      other_kind === "error" ||
      other_kind === "error-simple" ||
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

/** @type {import("./hoisting-private").Scoping} */
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

/** @type {import("./hoisting-private").Scoping} */
const SCRIPT_SCOPING = {
  "var": false,
  "let": false,
  "const": false,
  "function-strict": false,
  "function-sloppy-near": false,
  "function-sloppy-away": false,
  "class": false,
};

/** @type {import("./hoisting-private").Scoping} */
const SLOPPY_EVAL_SCOPING = {
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": false,
  "function-sloppy-away": false,
  "class": true,
};

/** @type {import("./hoisting-private").Scoping} */
const STRICT_EVAL_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "class": true,
};

/** @type {import("./hoisting-private").Scoping} */
const CATCH_HEAD_SCOPING = {
  "error": true,
  "error-simple": true,
  "var": false,
  "function-sloppy-away": false,
};

/** @type {import("./hoisting-private").Scoping} */
const CATCH_BODY_SCOPING = {
  "error": false,
  "error-simple": false,
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": false,
  "class": true,
};

/** @type {import("./hoisting-private").Scoping} */
const CLOSURE_BODY_SCOPING = {
  "param": false,
  "param-simple": false,
  "function-self-strict": false,
  "function-self-sloppy": false,
  "arguments": false,
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": true,
  "class": true,
};

/** @type {import("./hoisting-private").Scoping} */
const CLOSURE_HEAD_SCOPING = {
  "param": true,
  "param-simple": true,
  "function-self-strict": true,
  "function-self-sloppy": true,
  "arguments": true,
};

// We need to distinguish between simple and non-simple parameters.
// Because variable lately declared in direct eval calls are merged
// with simple parameters but not with non-simple parameters.
//
// (((foo) => {
//   eval(`
//     console.log(foo); // 123
//     { var foo }
//   `);
// }) (123))
//
// (((foo, bar = 456) => {
//   eval(`
//     console.log(foo); // undefined
//     { var foo }
//   `);
// }) (123))

/** @type {import("./hoisting-private").Scoping} */
const SIMPLE_CLOSURE_BODY_SCOPING = {
  "param": false,
  "param-simple": false,
  "function-self-strict": false,
  "function-self-sloppy": false,
  "arguments": false,
  "var": false,
  "let": false,
  "const": false,
  "function-strict": false,
  "function-sloppy-near": false,
  "function-sloppy-away": false,
  "class": false,
};

/** @type {import("./hoisting-private").Scoping} */
const SIMPLE_CLOSURE_HEAD_SCOPING = {
  "param": true,
  "param-simple": true,
  "function-self-strict": true,
  "function-self-sloppy": true,
  "arguments": true,
  "var": true,
  "let": true,
  "const": true,
  "class": true,
  "function-strict": true,
  "function-sloppy-away": true,
  "function-sloppy-near": true,
};

/** @type {import("./hoisting-private").Scoping} */
const BLOCK_SCOPING = {
  "var": false,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": false,
  "class": true,
};

/** @type {import("./hoisting-private").Scoping} */
const STATIC_BLOCK_SCOPING = {
  "var": true,
  "let": true,
  "const": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": true,
  "class": true,
};

const CLASS_EXPRESSION_SCOPING = {
  "class-self": true,
};

/**
 * @type {(
 *   kind: "module" | "eval" | "script",
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Scoping}
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
 *   binding: import("./hoisting-private").Binding,
 * ) => binding is import("./hoisting-private").FreeBinding}
 */
const isFreeBinding = (binding) => binding.type === "free";

/**
 * @type {(
 *   binding: import("./hoisting-private").Binding,
 * ) => binding is (
 *   | import("./hoisting-private").LockBinding
 *   | import("./hoisting-private").FlagBinding
 *   | import("./hoisting-private").VoidBinding
 * )}
 */
const isNotFreeBinding = (binding) =>
  binding.type === "lock" || binding.type === "flag" || binding.type === "void";

/**
 * @type {(
 *   hoist: import("./hoisting-private").FreeBinding,
 *   hash: import("../../hash").Hash
 * ) => import("./hoisting-private").LockBinding}
 */
const lockupBinding = (binding, hash) => ({
  ...binding,
  type: "lock",
  bind: hash,
});

/**
 * @type {(
 *   hoist: import("./hoisting-private").Binding,
 *   cause: "duplicate" | "keyword",
 * ) => import("./hoisting-private").FlagBinding}
 */
const reportBinding = (binding, cause) => ({
  ...binding,
  type: "flag",
  bind: cause,
});

/**
 * @type {(
 *   hoist: import("./hoisting-private").FreeBinding,
 * ) => import("./hoisting-private").VoidBinding}
 */
const removeBinding = (binding) => ({
  ...binding,
  type: "void",
  bind: null,
});

/**
 * @type {(
 *   accumulation: import("./hoisting-private").DuplicateAccumulation,
 *   index: number,
 * ) => import("./hoisting-private").DuplicateAccumulation}
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
            binding: reportBinding(accumulation.binding, "duplicate"),
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
 *   bindings: import("./hoisting-private").FreeBinding[],
 *   current: import("../../hash").Hash,
 * ) => import("./hoisting-private").Binding[]}
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
 *   scoping: import("./hoisting-private").Scoping,
 *   binding: import("./hoisting-private").FreeBinding,
 *   hash: import("../../hash").Hash
 * ) => import("./hoisting-private").Binding}
 */
const scopeBinding = (scoping, binding, hash) => {
  if (hasOwn(scoping, binding.kind)) {
    if (scoping[binding.kind]) {
      return lockupBinding(binding, hash);
    } else {
      return binding;
    }
  } else {
    throw new AranExecError("out-of-scope kind", { scoping, binding, hash });
  }
};

/**
 * @type {(
 *   scoping: import("./hoisting-private").Scoping,
 *   hoisting: import("./hoisting-private").Hoisting,
 *   hash: import("../../hash").Hash,
 * ) => import("./hoisting-private").Hoisting}
 */
const scopeHoisting = (scoping, hoisting, hash) => [
  map(
    reportDuplicate(filterNarrowTree(hoisting, isFreeBinding), hash),
    (binding) =>
      isFreeBinding(binding) ? scopeBinding(scoping, binding, hash) : binding,
  ),
  filterNarrowTree(hoisting, isNotFreeBinding),
];

///////////
// hoist //
///////////

/**
 * @type {(
 *   node: import("estree-sentry").Program<import("../../hash").HashProp>,
 *   kind: "module" | "eval" | "script",
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistProgram = (node, kind, mode) => {
  const next_mode = updateMode(
    node.sourceType === "module" ? "strict" : mode,
    node.body,
  );
  return scopeHoisting(
    getProgramScoping(kind, next_mode),
    map(node.body, (node) => hoistProgramElement(node, next_mode)),
    node._hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").DefaultDeclaration<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistDefault = (node, mode) => {
  switch (node.type) {
    case "FunctionDeclaration": {
      if (node.id == null) {
        const simple = everyNarrow(node.params, isVariableIdentifier);
        /** @type {import("./hoisting-private").Kind} */
        const kind = simple ? "param-simple" : "param";
        return scopeHoisting(
          simple ? SIMPLE_CLOSURE_HEAD_SCOPING : CLOSURE_HEAD_SCOPING,
          [
            {
              type: "free",
              kind: "arguments",
              variable: /** @type {import("estree-sentry").VariableName} */ (
                "arguments"
              ),
              origin: node._hash,
              bind: null,
            },
            scopeHoisting(
              simple ? SIMPLE_CLOSURE_BODY_SCOPING : CLOSURE_BODY_SCOPING,
              [
                map(node.params, (child) => hoistPattern(child, kind, mode)),
                map(node.body.body, (child) => hoistStatement(child, mode)),
              ],
              node.body._hash,
            ),
          ],
          node._hash,
        );
      } else {
        return hoistStatement(node, mode);
      }
    }
    case "ClassDeclaration": {
      if (node.id == null) {
        return [
          node.superClass == null
            ? EMPTY
            : hoistExpression(node.superClass, mode),
          hoistClassBody(node.body, mode),
        ];
      } else {
        return hoistStatement(node, mode);
      }
    }
    default: {
      return hoistExpression(node, mode);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").ImportSpecifier<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Binding}
 */
const hoistImportSpecifier = (node, _mode) => ({
  type: "free",
  kind: "import",
  variable: node.local.name,
  origin: node._hash,
  bind: null,
});

/**
 * @type {(
 *   node: import("estree-sentry").ModuleStatement<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistProgramElement = (node, mode) => {
  if (node.type === "ImportDeclaration") {
    return mapIndex(node.specifiers.length, (index) =>
      hoistImportSpecifier(node.specifiers[index], mode),
    );
  } else if (node.type === "ExportDefaultDeclaration") {
    return hoistDefault(node.declaration, mode);
  } else if (node.type === "ExportNamedDeclaration") {
    return node.declaration == null
      ? EMPTY
      : hoistStatement(node.declaration, mode);
  } else if (node.type === "ExportAllDeclaration") {
    return EMPTY;
  } else {
    return hoistStatement(node, mode);
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").CatchClause<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistCatchClause = (node, mode) =>
  scopeHoisting(
    CATCH_HEAD_SCOPING,
    scopeHoisting(
      CATCH_BODY_SCOPING,
      [
        node.param == null
          ? EMPTY
          : hoistPattern(
              node.param,
              node.param.type === "Identifier" ? "error-simple" : "error",

              mode,
            ),
        map(node.body.body, (node) => hoistStatement(node, mode)),
      ],
      node.body._hash,
    ),
    node._hash,
  );

/**
 * @type {(
 *   node: import("estree-sentry").SwitchCase<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistSwitchCase = (node, mode) =>
  map(node.consequent, (node) => hoistStatement(node, mode));

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *     | import("estree-sentry").Super<import("../../hash").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../../hash").HashProp>
 *     | import("estree-sentry").ObjectProperty<import("../../hash").HashProp>
 *     | import("estree-sentry").ChainCallExpression<import("../../hash").HashProp>
 *     | import("estree-sentry").ChainMemberExpression<import("../../hash").HashProp>
 *   ),
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistExpression = (node, mode) => {
  switch (node.type) {
    case "Identifier": {
      return EMPTY;
    }
    case "ThisExpression": {
      return EMPTY;
    }
    case "ArrayExpression": {
      return map(node.elements, (element) =>
        element == null ? EMPTY : hoistExpression(element, mode),
      );
    }
    case "ObjectExpression": {
      return map(node.properties, (property) =>
        hoistExpression(property, mode),
      );
    }
    case "FunctionExpression": {
      const simple = everyNarrow(node.params, isVariableIdentifier);
      /** @type {import("./hoisting-private").Kind} */
      const kind = simple ? "param-simple" : "param";
      return scopeHoisting(
        simple ? SIMPLE_CLOSURE_HEAD_SCOPING : CLOSURE_HEAD_SCOPING,
        [
          node.id == null
            ? EMPTY
            : hoistPattern(node.id, `function-self-${mode}`, mode),
          {
            type: "free",
            kind: "arguments",
            variable: /** @type {import("estree-sentry").VariableName} */ (
              "arguments"
            ),
            origin: node._hash,
            bind: null,
          },
          scopeHoisting(
            simple ? SIMPLE_CLOSURE_BODY_SCOPING : CLOSURE_BODY_SCOPING,
            [
              map(node.params, (child) => hoistPattern(child, kind, mode)),
              map(node.body.body, (child) => hoistStatement(child, mode)),
            ],
            node.body._hash,
          ),
        ],
        node._hash,
      );
    }
    case "ArrowFunctionExpression": {
      const simple = everyNarrow(node.params, isVariableIdentifier);
      const kind = simple ? "param-simple" : "param";
      if (node.body.type === "BlockStatement") {
        return scopeHoisting(
          simple ? SIMPLE_CLOSURE_HEAD_SCOPING : CLOSURE_HEAD_SCOPING,
          scopeHoisting(
            simple ? SIMPLE_CLOSURE_BODY_SCOPING : CLOSURE_BODY_SCOPING,
            [
              map(node.params, (child) => hoistPattern(child, kind, mode)),
              map(node.body.body, (child) => hoistStatement(child, mode)),
            ],
            node.body._hash,
          ),
          node._hash,
        );
      } else {
        return scopeHoisting(
          simple ? SIMPLE_CLOSURE_HEAD_SCOPING : CLOSURE_HEAD_SCOPING,
          [
            map(node.params, (child) => hoistPattern(child, kind, mode)),
            hoistExpression(node.body, mode),
          ],
          node._hash,
        );
      }
    }
    case "YieldExpression": {
      return node.argument == null
        ? EMPTY
        : hoistExpression(node.argument, mode);
    }
    case "UnaryExpression": {
      return hoistExpression(node.argument, mode);
    }
    case "UpdateExpression": {
      return hoistPattern(node.argument, null, mode);
    }
    case "BinaryExpression": {
      return [
        node.left.type === "PrivateIdentifier"
          ? EMPTY
          : hoistExpression(node.left, mode),
        hoistExpression(node.right, mode),
      ];
    }
    case "AssignmentExpression": {
      if (node.left.type === "CallExpression") {
        return [
          hoistExpression(node.left, mode),
          hoistExpression(node.right, mode),
        ];
      } else {
        return [
          hoistPattern(node.left, null, mode),
          hoistExpression(node.right, mode),
        ];
      }
    }
    case "LogicalExpression": {
      return [
        hoistExpression(node.left, mode),
        hoistExpression(node.right, mode),
      ];
    }
    case "MemberExpression": {
      return [
        hoistExpression(node.object, mode),
        node.computed ? hoistExpression(node.property, mode) : EMPTY,
      ];
    }
    case "ConditionalExpression": {
      return [
        hoistExpression(node.test, mode),
        hoistExpression(node.consequent, mode),
        hoistExpression(node.alternate, mode),
      ];
    }
    case "CallExpression": {
      return [
        hoistExpression(node.callee, mode),
        map(node.arguments, (node) => hoistExpression(node, mode)),
      ];
    }
    case "NewExpression": {
      return [
        hoistExpression(node.callee, mode),
        map(node.arguments, (node) => hoistExpression(node, mode)),
      ];
    }
    case "SequenceExpression": {
      return map(node.expressions, (node) => hoistExpression(node, mode));
    }
    case "TemplateLiteral": {
      return map(node.expressions, (node) => hoistExpression(node, mode));
    }
    case "TaggedTemplateExpression": {
      return [
        hoistExpression(node.tag, mode),
        hoistExpression(node.quasi, mode),
      ];
    }
    case "MetaProperty": {
      return EMPTY;
    }
    case "AwaitExpression": {
      return hoistExpression(node.argument, mode);
    }
    case "ImportExpression": {
      return hoistExpression(node.source, mode);
    }
    case "ChainExpression": {
      return hoistExpression(node.expression, mode);
    }
    case "Literal": {
      return EMPTY;
    }
    case "ClassExpression": {
      return scopeHoisting(
        CLASS_EXPRESSION_SCOPING,
        [
          node.id == null ? EMPTY : hoistPattern(node.id, "class-self", mode),
          node.superClass == null
            ? EMPTY
            : hoistExpression(node.superClass, mode),
          hoistClassBody(node.body, mode),
        ],
        node._hash,
      );
    }
    case "Super": {
      return EMPTY;
    }
    case "SpreadElement": {
      return hoistExpression(node.argument, mode);
    }
    case "Property": {
      return [
        hoistExpression(node.value, mode),
        node.computed ? hoistExpression(node.key, mode) : EMPTY,
      ];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * This is necessary to avoid colliding bindings from the head of the function
 * to the binding in the branch of the if statement.
 * ```js
 * (() => {
 *   console.log({ f }); // { f: undefined }
 *   if (true)
 *     function f() {
 *       return (f = 123, f);
 *     }
 *   console.log({ f, g: f() }); // { f : [Function: f], g: 123 }
 * })();
 * ```
 * @type {(
 *   hash: import("../../hash").Hash,
 * ) => import("../../hash").Hash}
 */
export const makeSloppyFunctionFakeHash = (hash) =>
  /** @type {import("../../hash").Hash} */ (`${hash}@fake`);

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").VariableDeclarator<import("../../hash").HashProp>
 *     | import("estree-sentry").RestablePattern<import("../../hash").HashProp>
 *     | import("estree-sentry").PatternProperty<import("../../hash").HashProp>
 *   ),
 *   kind: null | import("./hoisting-private").Kind,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistPattern = (node, kind, mode) => {
  switch (node.type) {
    case "Identifier": {
      if (kind === null) {
        return EMPTY;
      } else {
        return [
          {
            type: "free",
            kind,
            variable: node.name,
            origin: node._hash,
            bind: null,
          },
        ];
      }
    }
    case "VariableDeclarator": {
      return [
        hoistPattern(node.id, kind, mode),
        node.init == null ? EMPTY : hoistExpression(node.init, mode),
      ];
    }
    case "MemberExpression": {
      return [
        hoistExpression(node.object, mode),
        node.computed ? hoistExpression(node.property, mode) : EMPTY,
      ];
    }
    case "AssignmentPattern": {
      return [
        hoistPattern(node.left, kind, mode),
        hoistExpression(node.right, mode),
      ];
    }
    case "ArrayPattern": {
      return map(node.elements, (node) =>
        node == null ? EMPTY : hoistPattern(node, kind, mode),
      );
    }
    case "ObjectPattern": {
      return map(node.properties, (node) => hoistPattern(node, kind, mode));
    }
    case "RestElement": {
      return hoistPattern(node.argument, kind, mode);
    }
    case "Property": {
      return [
        hoistPattern(node.value, kind, mode),
        node.computed ? hoistExpression(node.key, mode) : EMPTY,
      ];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistClassBody = (node, mode) =>
  map(node.body, (child) => hoistClassEntry(child, mode));

/**
 * @type {(
 *   node: import("estree-sentry").ClassEntry<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistClassEntry = (node, mode) => {
  switch (node.type) {
    case "MethodDefinition": {
      return [
        node.computed ? hoistExpression(node.key, mode) : EMPTY,
        node.value == null ? EMPTY : hoistExpression(node.value, mode),
      ];
    }
    case "PropertyDefinition": {
      return [
        node.computed ? hoistExpression(node.key, mode) : EMPTY,
        node.value == null ? EMPTY : hoistExpression(node.value, mode),
      ];
    }
    case "StaticBlock": {
      return scopeHoisting(
        STATIC_BLOCK_SCOPING,
        map(node.body, (node) => hoistStatement(node, mode)),
        node._hash,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Statement<import("../../hash").HashProp>,
 *   mode: import("../mode").Mode,
 * ) => import("./hoisting-private").Hoisting}
 */
const hoistStatement = (node, mode) => {
  switch (node.type) {
    case "VariableDeclaration": {
      const { kind } = node;
      return map(node.declarations, (node) => hoistPattern(node, kind, mode));
    }
    case "ClassDeclaration": {
      return [
        hoistPattern(node.id, "class", mode),
        node.superClass == null
          ? EMPTY
          : hoistExpression(node.superClass, mode),
        hoistClassBody(node.body, mode),
      ];
    }
    case "FunctionDeclaration": {
      const simple = everyNarrow(node.params, isVariableIdentifier);
      /** @type {import("./hoisting-private").Kind} */
      const kind = simple ? "param-simple" : "param";
      return [
        node.async || node.generator || mode === "strict"
          ? hoistPattern(node.id, "function-strict", mode)
          : [
              hoistPattern(node.id, "function-sloppy-near", mode),
              hoistPattern(node.id, "function-sloppy-away", mode),
            ],
        scopeHoisting(
          CLOSURE_HEAD_SCOPING,
          scopeHoisting(
            CLOSURE_BODY_SCOPING,
            [
              {
                type: "free",
                kind: "arguments",
                variable: /** @type {import("estree-sentry").VariableName} */ (
                  "arguments"
                ),
                origin: node._hash,
                bind: null,
              },
              map(node.params, (child) => hoistPattern(child, kind, mode)),
              map(node.body.body, (child) => hoistStatement(child, mode)),
            ],
            node.body._hash,
          ),
          node._hash,
        ),
      ];
    }
    case "IfStatement": {
      return [
        hoistExpression(node.test, mode),
        mapTree(hoistStatement(node.consequent, mode), (binding) =>
          binding.kind === "function-sloppy-near" && isFreeBinding(binding)
            ? lockupBinding(
                binding,
                makeSloppyFunctionFakeHash(node.consequent._hash),
              )
            : binding,
        ),
        mapTree(
          node.alternate == null ? EMPTY : hoistStatement(node.alternate, mode),
          (binding) =>
            binding.kind === "function-sloppy-near" &&
            isFreeBinding(binding) &&
            node.alternate != null
              ? lockupBinding(
                  binding,
                  makeSloppyFunctionFakeHash(node.alternate._hash),
                )
              : binding,
        ),
      ];
    }
    case "LabeledStatement": {
      return hoistStatement(node.body, mode);
    }
    case "WhileStatement": {
      return [
        hoistExpression(node.test, mode),
        hoistStatement(node.body, mode),
      ];
    }
    case "DoWhileStatement": {
      return [
        hoistExpression(node.test, mode),
        hoistStatement(node.body, mode),
      ];
    }
    case "ForStatement": {
      if (node.init != null && node.init.type === "VariableDeclaration") {
        return scopeHoisting(
          BLOCK_SCOPING,
          [
            hoistStatement(node.init, mode),
            node.test == null ? EMPTY : hoistExpression(node.test, mode),
            node.update == null ? EMPTY : hoistExpression(node.update, mode),
            hoistStatement(node.body, mode),
          ],
          node._hash,
        );
      } else {
        return [
          node.init == null ? EMPTY : hoistExpression(node.init, mode),
          node.test == null ? EMPTY : hoistExpression(node.test, mode),
          node.update == null ? EMPTY : hoistExpression(node.update, mode),
          hoistStatement(node.body, mode),
        ];
      }
    }
    case "ForInStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeHoisting(
          BLOCK_SCOPING,
          [
            hoistStatement(node.left, mode),
            hoistExpression(node.right, mode),
            hoistStatement(node.body, mode),
          ],
          node._hash,
        );
      } else {
        return [
          hoistPattern(node.left, null, mode),
          hoistExpression(node.right, mode),
          hoistStatement(node.body, mode),
        ];
      }
    }
    case "ForOfStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeHoisting(
          BLOCK_SCOPING,
          [
            hoistStatement(node.left, mode),
            hoistExpression(node.right, mode),
            hoistStatement(node.body, mode),
          ],
          node._hash,
        );
      } else {
        return [
          hoistPattern(node.left, null, mode),
          hoistExpression(node.right, mode),
          hoistStatement(node.body, mode),
        ];
      }
    }
    case "BlockStatement": {
      return scopeHoisting(
        BLOCK_SCOPING,
        map(node.body, (node) => hoistStatement(node, mode)),
        node._hash,
      );
    }
    case "SwitchStatement": {
      // switch (0) { default: function x() {} }
      // x; >> reference error
      return scopeHoisting(
        BLOCK_SCOPING,
        [
          hoistExpression(node.discriminant, mode),
          map(node.cases, (node) => hoistSwitchCase(node, mode)),
        ],
        node._hash,
      );
    }
    case "TryStatement": {
      return [
        hoistStatement(node.block, mode),
        node.handler == null ? EMPTY : hoistCatchClause(node.handler, mode),
        node.finalizer == null ? EMPTY : hoistStatement(node.finalizer, mode),
      ];
    }
    case "WithStatement": {
      return [
        hoistExpression(node.object, mode),
        hoistStatement(node.body, mode),
      ];
    }
    case "ThrowStatement": {
      return hoistExpression(node.argument, mode);
    }
    case "ExpressionStatement": {
      return hoistExpression(node.expression, mode);
    }
    case "ReturnStatement": {
      return node.argument == null
        ? EMPTY
        : hoistExpression(node.argument, mode);
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
 * @type {{
 *   [key in import("./hoisting-private").Kind]
 *     : boolean
 * }}
 */
const DUPLICABLE_KIND_RECORD = {
  "function-self-sloppy": true,
  "const": false,
  "import": false,
  "function-self-strict": false,
  "class-self": false,
  "var": true,
  "let": false,
  "class": false,
  "error": false,
  "param": false,
  "param-simple": true,
  "error-simple": true,
  "function-strict": true,
  "function-sloppy-near": true,
  "function-sloppy-away": true,
  "arguments": true,
};

/**
 * @type {{
 *   [key in import("./hoisting-private").Kind]
 *     : import("./hoisting").Write
 * }}
 */
const WRITE_KIND_RECORD = {
  "function-self-sloppy": "ignore",
  "const": "report",
  "import": "report",
  "function-self-strict": "report",
  "class-self": "report",
  "var": "perform",
  "let": "perform",
  "class": "perform",
  "error": "perform",
  "param": "perform",
  "param-simple": "perform",
  "error-simple": "perform",
  "function-strict": "perform",
  "function-sloppy-near": "perform",
  "function-sloppy-away": "perform",
  "arguments": "perform",
};

/**
 * @type {{
 *   [key in import("./hoisting-private").Kind]
 *     : import("./hoisting").Initial
 * }}
 */
const INITIAL_KIND_RECORD = {
  "let": "deadzone",
  "const": "deadzone",
  "class": "deadzone",
  "error": "deadzone",
  "param": "deadzone",
  "class-self": "self-class",
  "import": "import",
  "var": "undefined",
  "param-simple": "undefined",
  "error-simple": "deadzone",
  "function-strict": "undefined",
  "function-sloppy-near": "undefined",
  "function-sloppy-away": "undefined",
  "function-self-strict": "self-function",
  "function-self-sloppy": "self-function",
  "arguments": "arguments",
};

/**
 * @type {(
 *   binding: (
 *     | import("./hoisting-private").FreeBinding
 *     | import("./hoisting-private").LockBinding
 *   ),
 * ) => import("./hoisting").Binding}
 */
const toPublicBinding = ({ kind, variable }) => ({
  variable,
  duplicable: DUPLICABLE_KIND_RECORD[kind],
  write: WRITE_KIND_RECORD[kind],
  initial: INITIAL_KIND_RECORD[kind],
  sloppy_function_away: kind === "function-sloppy-away" ? 1 : 0,
  sloppy_function_near: kind === "function-sloppy-near" ? 1 : 0,
});

/**
 * @type {(
 *   binding1: import("./hoisting").Binding,
 *   binding2: import("./hoisting").Binding,
 * ) => import("./hoisting").Binding}
 */
const mergeBinding = (binding1, binding2) => {
  if (
    binding1.variable === binding2.variable &&
    binding1.initial === binding2.initial &&
    binding1.write === binding2.write
  ) {
    return {
      ...binding1,
      sloppy_function_away:
        binding1.sloppy_function_away + binding2.sloppy_function_away,
      sloppy_function_near:
        binding1.sloppy_function_near + binding2.sloppy_function_near,
    };
  } else {
    throw new AranExecError("incompatible binding", { binding1, binding2 });
  }
};

const SLOPPY_ILLEGAL_RECORD = KEYWORD_RECORD;

const STRICT_ILLEGAL_RECORD = {
  ...KEYWORD_RECORD,
  ...STRICT_KEYWORD_RECORD,
  eval: null,
  arguments: null,
};

/**
 * @type {(
 *   mode: import("../mode").Mode,
 * ) => { [key in string] ?: null }}
 */
const getIllegalRecord = (mode) => {
  switch (mode) {
    case "strict": {
      return STRICT_ILLEGAL_RECORD;
    }
    case "sloppy": {
      return SLOPPY_ILLEGAL_RECORD;
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   binding: import("./hoisting-private").Binding,
 *   illegal: { [key in string] ?: null },
 * ) => import("./hoisting-private").Binding}
 */
const reportIllegalBinding = (binding, illegal) => {
  if (hasOwn(illegal, binding.variable)) {
    if (binding.variable === "arguments" && binding.kind === "arguments") {
      return binding;
    } else {
      return reportBinding(binding, "keyword");
    }
  } else {
    return binding;
  }
};

/**
 * @type {(
 *   binding: import("./hoisting-private").FlagBinding,
 * ) => import("./hoisting").Error}
 */
const toError = (binding) => {
  switch (binding.bind) {
    case "keyword": {
      return {
        message: `Illegal keyword variable: '${binding.variable}'`,
        origin: binding.origin,
      };
    }
    case "duplicate": {
      return {
        message: `Duplicate variable: '${binding.variable}'`,
        origin: binding.origin,
      };
    }
    default: {
      throw new AranTypeError(binding.bind);
    }
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: import("estree-sentry").Program<import("../../hash").HashProp>,
 *   kind: "module" | "eval" | "script",
 *   mode: import("../mode").Mode,
 * ) => {
 *   report: import("./hoisting").Error[],
 *   unbound: import("./hoisting").Binding[],
 *   hoisting: {
 *     [key in import("../../hash").Hash]
 *       ?: import("./hoisting").Binding[]
 *   },
 * }}
 */
export const annotateHoisting = (node, kind, mode) => {
  const illegal = getIllegalRecord(mode);
  const bindings = mapTree(hoistProgram(node, kind, mode), (binding) =>
    reportIllegalBinding(binding, illegal),
  );
  /** @type {import("./hoisting").Binding[]} */
  const unbound = [];
  /**
   * @type {{
   *   [key in import("../../hash").Hash]
   *     ?: import("./hoisting").Binding[]
   * }}
   */
  const hoisting = /** @type {any} */ ({ __proto__: null });
  /** @type {import("./hoisting").Error[]} */
  const report = [];
  for (const binding of bindings) {
    if (binding.type === "flag") {
      report[report.length] = toError(binding);
    } else if (binding.type === "void") {
      // nope
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
          frame[index] = mergeBinding(toPublicBinding(binding), other);
          merged = true;
          index = length;
        }
      }
      if (!merged) {
        frame[length] = toPublicBinding(binding);
      }
    } else {
      throw new AranTypeError(binding);
    }
  }
  return { report, unbound, hoisting };
};
/* eslint-enable local/no-impure */
