/* eslint-disable no-use-before-define */

import { AranExecError, AranTypeError } from "../../report.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "../../estree.mjs";
import {
  EMPTY,
  concatXX,
  concatXXX,
  concatXXXX,
  concat_XX,
  everyNarrow,
  filterNarrow,
  flatMap,
  flatMapIndex,
  hasOwn,
  map,
  mapIndex,
  reduceIndex,
} from "../../util/index.mjs";
import { hasUseStrictDirective } from "../query/index.mjs";

//////////
// util //
//////////

/**
 * @type {(
 *   node: import("../../estree").Pattern,
 * ) => node is import("../../estree").VariableIdentifier}
 */
const isVariableIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   mode: import("./hoisting-private").Mode,
 *   body: (
 *     | import("../../estree").Statement
 *     | import("../../estree").Directive
 *     | import("../../estree").ModuleDeclaration
 *   )[],
 * ) => import("./hoisting-private").Mode}
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
  if (kind === "function-sloppy-away") {
    if (
      other_kind === "param" ||
      other_kind === "param-legacy" ||
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
      other_kind === "error-legacy"
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
      other_kind === "error-legacy"
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
      other_kind === "error-legacy" ||
      other_kind === "var" ||
      other_kind === "function-strict" ||
      other_kind === "function-sloppy-near"
    ) {
      return "report";
    } else {
      throw new AranTypeError(other_kind);
    }
  } else if (kind === "error" || kind === "error-legacy") {
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
      other_kind === "error-legacy" ||
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
      other_kind === "error-legacy" ||
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
      other_kind === "error-legacy" ||
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
      other_kind === "error-legacy" ||
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

// Normally sloppy functions should be scoped to the surrounding closure if they
// do not clash. This has not been implemented and the sloppy function will be
// scoped to the program instead.
//
// cf: ./doc/issue/eval-function-declaration.md
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
  "function-sloppy-near": true,
  "function-sloppy-away": true,
  "class": true,
};

/** @type {import("./hoisting-private").Scoping} */
const CATCH_HEAD_SCOPING = {
  "error": true,
  "error-legacy": true,
  "var": false,
  "function-sloppy-away": false,
};

/** @type {import("./hoisting-private").Scoping} */
const CATCH_BODY_SCOPING = {
  "error": false,
  "error-legacy": false,
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
  "param-legacy": false,
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
  "param-legacy": true,
};

/** @type {import("./hoisting-private").Scoping} */
const SIMPLE_CLOSURE_BODY_SCOPING = {
  "param": false,
  "param-legacy": false,
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
  "param-legacy": true,
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

/**
 * @type {(
 *   kind: "module" | "eval" | "script",
 *   mode: import("./hoisting-private").Mode,
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
 *   bindings: import("./hoisting-private").Binding[],
 *   hash: import("../../hash").Hash,
 * ) => import("./hoisting-private").Binding[]}
 */
const scopeBindingArray = (scoping, bindings, hash) =>
  concatXX(
    map(
      reportDuplicate(filterNarrow(bindings, isFreeBinding), hash),
      (hoist) =>
        isFreeBinding(hoist) ? scopeBinding(scoping, hoist, hash) : hoist,
    ),
    filterNarrow(bindings, isNotFreeBinding),
  );

///////////
// hoist //
///////////

/**
 * @type {(
 *   node: import("../../estree").Program,
 *   kind: "module" | "eval" | "script",
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistProgram = (node, kind, digest, mode) => {
  const next_mode = updateMode(
    node.sourceType === "module" ? "strict" : mode,
    node.body,
  );
  return scopeBindingArray(
    getProgramScoping(kind, next_mode),
    flatMapIndex(node.body.length, (index) =>
      hoistProgramElement(node.body[index], digest, next_mode),
    ),
    digest(node),
  );
};

/**
 * @type {(
 *   node: import("../../estree").ExportDefaultDeclaration["declaration"],
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistDefault = (node, digest, mode) => {
  if (node.type === "ClassDeclaration" || node.type === "FunctionDeclaration") {
    if (node.id == null) {
      return EMPTY;
    } else {
      return hoistStatement(node, digest, mode);
    }
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
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding}
 */
const hoistImportSpecifier = (node, digest, _mode) => ({
  type: "free",
  kind: "import",
  variable: /** @type {import("../../estree").Variable} */ (node.local.name),
  origin: digest(node),
  bind: null,
});

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Directive
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *   ),
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistProgramElement = (node, digest, mode) => {
  if (node.type === "ImportDeclaration") {
    return mapIndex(node.specifiers.length, (index) =>
      hoistImportSpecifier(node.specifiers[index], digest, mode),
    );
  } else if (node.type === "ExportDefaultDeclaration") {
    return hoistDefault(node.declaration, digest, mode);
  } else if (node.type === "ExportNamedDeclaration") {
    return node.declaration == null
      ? EMPTY
      : hoistStatement(node.declaration, digest, mode);
  } else if (node.type === "ExportAllDeclaration") {
    return EMPTY;
  } else {
    return hoistStatement(node, digest, mode);
  }
};

/**
 * @type {(
 *   node: import("../../estree").Function,
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistFunction = (node, digest, mode) => {
  /** @type {import("./hoisting-private").Kind} */
  const kind =
    node.type !== "ArrowFunctionExpression" &&
    everyNarrow(node.params, isVariableIdentifier)
      ? "param-legacy"
      : "param";
  if (node.body.type === "BlockStatement") {
    const simple = everyNarrow(node.params, isVariableIdentifier);
    const kind =
      node.type !== "ArrowFunctionExpression" && simple
        ? "param-legacy"
        : "param";
    return scopeBindingArray(
      simple ? SIMPLE_CLOSURE_HEAD_SCOPING : CLOSURE_HEAD_SCOPING,
      scopeBindingArray(
        simple ? SIMPLE_CLOSURE_BODY_SCOPING : CLOSURE_BODY_SCOPING,
        concatXX(
          flatMap(node.params, (child) =>
            hoistPattern(child, kind, digest, mode),
          ),
          flatMap(node.body.body, (child) =>
            hoistStatement(child, digest, mode),
          ),
        ),
        digest(node.body),
      ),
      digest(node),
    );
  } else {
    return scopeBindingArray(
      CLOSURE_HEAD_SCOPING,
      concatXX(
        flatMap(node.params, (child) =>
          hoistPattern(child, kind, digest, mode),
        ),
        hoistExpression(node.body, digest, mode),
      ),
      digest(node),
    );
  }
};

/**
 * @type {(
 *   node: import("../../estree").CatchClause,
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistCatchClause = (node, digest, mode) =>
  scopeBindingArray(
    CATCH_HEAD_SCOPING,
    scopeBindingArray(
      CATCH_BODY_SCOPING,
      concatXX(
        node.param == null
          ? EMPTY
          : hoistPattern(
              node.param,
              node.param.type === "Identifier" ? "error-legacy" : "error",
              digest,
              mode,
            ),
        flatMapIndex(node.body.body.length, (index) =>
          hoistStatement(node.body.body[index], digest, mode),
        ),
      ),
      digest(node.body),
    ),
    digest(node),
  );

/**
 * @type {(
 *   node: import("../../estree").SwitchCase,
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistSwitchCase = (node, digest, mode) =>
  flatMapIndex(node.consequent.length, (index) =>
    hoistStatement(node.consequent[index], digest, mode),
  );

/**
 * @type {(
 *   node: (
 *     | import("../../estree").Expression
 *     | import("../../estree").Super
 *     | import("../../estree").SpreadElement
 *     | import("../../estree").ObjectProperty
 *   ),
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistExpression = (node, digest, mode) => {
  switch (node.type) {
    case "Identifier": {
      return EMPTY;
    }
    case "ThisExpression": {
      return EMPTY;
    }
    case "ArrayExpression": {
      return flatMap(node.elements, (element) =>
        element == null ? EMPTY : hoistExpression(element, digest, mode),
      );
    }
    case "ObjectExpression": {
      return flatMap(node.properties, (property) =>
        hoistExpression(property, digest, mode),
      );
    }
    case "FunctionExpression": {
      return hoistFunction(node, digest, mode);
    }
    case "ArrowFunctionExpression": {
      return hoistFunction(node, digest, mode);
    }
    case "YieldExpression": {
      return node.argument == null
        ? EMPTY
        : hoistExpression(node.argument, digest, mode);
    }
    case "UnaryExpression": {
      return hoistExpression(node.argument, digest, mode);
    }
    case "UpdateExpression": {
      return hoistPattern(node.argument, null, digest, mode);
    }
    case "BinaryExpression": {
      return concatXX(
        node.left.type === "PrivateIdentifier"
          ? EMPTY
          : hoistExpression(node.left, digest, mode),
        hoistExpression(node.right, digest, mode),
      );
    }
    case "AssignmentExpression": {
      if (node.left.type === "CallExpression") {
        return concatXX(
          hoistExpression(node.left, digest, mode),
          hoistExpression(node.right, digest, mode),
        );
      } else {
        return concatXX(
          hoistPattern(node.left, null, digest, mode),
          hoistExpression(node.right, digest, mode),
        );
      }
    }
    case "LogicalExpression": {
      return concatXX(
        hoistExpression(node.left, digest, mode),
        hoistExpression(node.right, digest, mode),
      );
    }
    case "MemberExpression": {
      return concatXX(
        hoistExpression(node.object, digest, mode),
        node.computed ? hoistExpression(node.property, digest, mode) : EMPTY,
      );
    }
    case "ConditionalExpression": {
      return concatXXX(
        hoistExpression(node.test, digest, mode),
        hoistExpression(node.consequent, digest, mode),
        hoistExpression(node.alternate, digest, mode),
      );
    }
    case "CallExpression": {
      return concatXX(
        hoistExpression(node.callee, digest, mode),
        flatMap(node.arguments, (argument) =>
          hoistExpression(argument, digest, mode),
        ),
      );
    }
    case "NewExpression": {
      return concatXX(
        hoistExpression(node.callee, digest, mode),
        flatMap(node.arguments, (argument) =>
          hoistExpression(argument, digest, mode),
        ),
      );
    }
    case "SequenceExpression": {
      return flatMap(node.expressions, (expression) =>
        hoistExpression(expression, digest, mode),
      );
    }
    case "TemplateLiteral": {
      return flatMap(node.expressions, (expression) =>
        hoistExpression(expression, digest, mode),
      );
    }
    case "TaggedTemplateExpression": {
      return concatXX(
        hoistExpression(node.tag, digest, mode),
        flatMap(node.quasi.expressions, (expression) =>
          hoistExpression(expression, digest, mode),
        ),
      );
    }
    case "MetaProperty": {
      return EMPTY;
    }
    case "AwaitExpression": {
      return hoistExpression(node.argument, digest, mode);
    }
    case "ImportExpression": {
      return hoistExpression(node.source, digest, mode);
    }
    case "ChainExpression": {
      return hoistExpression(node.expression, digest, mode);
    }
    case "Literal": {
      return EMPTY;
    }
    case "ClassExpression": {
      return concatXX(
        node.superClass == null
          ? EMPTY
          : hoistExpression(node.superClass, digest, mode),
        hoistClassBody(node.body, digest, mode),
      );
    }
    case "Super": {
      return EMPTY;
    }
    case "SpreadElement": {
      return hoistExpression(node.argument, digest, mode);
    }
    case "Property": {
      return concatXX(
        hoistExpression(node.value, digest, mode),
        node.computed ? hoistExpression(node.key, digest, mode) : EMPTY,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").VariableDeclarator
 *     | import("../../estree").Pattern
 *     | import("../../estree").PatternProperty
 *   ),
 *   kind: null | import("./hoisting-private").Kind,
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistPattern = (node, kind, digest, mode) => {
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
            origin: digest(node),
            bind: null,
          },
        ];
      }
    }
    case "VariableDeclarator": {
      return concatXX(
        hoistPattern(node.id, kind, digest, mode),
        node.init == null ? EMPTY : hoistExpression(node.init, digest, mode),
      );
    }
    case "MemberExpression": {
      return concatXX(
        hoistExpression(node.object, digest, mode),
        node.computed ? hoistExpression(node.property, digest, mode) : EMPTY,
      );
    }
    case "AssignmentPattern": {
      return concatXX(
        hoistPattern(node.left, kind, digest, mode),
        hoistExpression(node.right, digest, mode),
      );
    }
    case "ArrayPattern": {
      return flatMap(node.elements, (element) =>
        element == null ? EMPTY : hoistPattern(element, kind, digest, mode),
      );
    }
    case "ObjectPattern": {
      return flatMap(node.properties, (property) =>
        hoistPattern(property, kind, digest, mode),
      );
    }
    case "RestElement": {
      return hoistPattern(node.argument, kind, digest, mode);
    }
    case "Property": {
      return concatXX(
        hoistPattern(node.value, kind, digest, mode),
        node.computed ? hoistExpression(node.key, digest, mode) : EMPTY,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").ClassBody,
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistClassBody = (node, digest, mode) =>
  flatMap(node.body, (child) => hoistClassElement(child, digest, mode));

/**
 * @type {(
 *   node: (
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   ),
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistClassElement = (node, digest, mode) => {
  switch (node.type) {
    case "MethodDefinition": {
      return concatXX(
        node.computed ? hoistExpression(node.key, digest, mode) : EMPTY,
        node.value == null ? EMPTY : hoistExpression(node.value, digest, mode),
      );
    }
    case "PropertyDefinition": {
      return concatXX(
        node.computed ? hoistExpression(node.key, digest, mode) : EMPTY,
        node.value == null ? EMPTY : hoistExpression(node.value, digest, mode),
      );
    }
    case "StaticBlock": {
      return scopeBindingArray(
        STATIC_BLOCK_SCOPING,
        flatMapIndex(node.body.length, (index) =>
          hoistStatement(node.body[index], digest, mode),
        ),
        digest(node),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").Statement,
 *   digest: import("../../hash").Digest,
 *   mode: import("./hoisting-private").Mode,
 * ) => import("./hoisting-private").Binding[]}
 */
const hoistStatement = (node, digest, mode) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return flatMap(node.declarations, (child) =>
        hoistPattern(child, node.kind, digest, mode),
      );
    }
    case "ClassDeclaration": {
      return concat_XX(
        {
          type: "free",
          kind: "class",
          variable: /** @type {import("../../estree").Variable} */ (
            node.id.name
          ),
          origin: digest(node),
          bind: null,
        },
        node.superClass == null
          ? EMPTY
          : hoistExpression(node.superClass, digest, mode),
        hoistClassBody(node.body, digest, mode),
      );
    }
    case "FunctionDeclaration": {
      switch (mode) {
        case "strict": {
          return concatXX(
            hoistPattern(node.id, "function-strict", digest, mode),
            hoistFunction(node, digest, mode),
          );
        }
        case "sloppy": {
          if (
            (hasOwn(node, "async") && !!node.async) ||
            (hasOwn(node, "generator") && !!node.generator)
          ) {
            return concatXX(
              hoistPattern(node.id, "function-strict", digest, mode),
              hoistFunction(node, digest, mode),
            );
          } else {
            return concatXXX(
              hoistPattern(node.id, "function-sloppy-near", digest, mode),
              hoistPattern(node.id, "function-sloppy-away", digest, mode),
              hoistFunction(node, digest, mode),
            );
          }
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
    case "IfStatement": {
      return concatXXX(
        hoistExpression(node.test, digest, mode),
        map(hoistStatement(node.consequent, digest, mode), (binding) =>
          binding.kind === "function-sloppy-near" && isFreeBinding(binding)
            ? lockupBinding(binding, digest(node.consequent))
            : binding,
        ),
        map(
          node.alternate == null
            ? EMPTY
            : hoistStatement(node.alternate, digest, mode),
          (binding) =>
            binding.kind === "function-sloppy-near" &&
            isFreeBinding(binding) &&
            node.alternate != null
              ? lockupBinding(binding, digest(node.alternate))
              : binding,
        ),
      );
    }
    case "LabeledStatement": {
      return hoistStatement(node.body, digest, mode);
    }
    case "WhileStatement": {
      return concatXX(
        hoistExpression(node.test, digest, mode),
        hoistStatement(node.body, digest, mode),
      );
    }
    case "DoWhileStatement": {
      return concatXX(
        hoistExpression(node.test, digest, mode),
        hoistStatement(node.body, digest, mode),
      );
    }
    case "ForStatement": {
      if (node.init != null && node.init.type === "VariableDeclaration") {
        return scopeBindingArray(
          BLOCK_SCOPING,
          concatXXXX(
            hoistStatement(node.init, digest, mode),
            node.test == null
              ? EMPTY
              : hoistExpression(node.test, digest, mode),
            node.update == null
              ? EMPTY
              : hoistExpression(node.update, digest, mode),
            hoistStatement(node.body, digest, mode),
          ),
          digest(node),
        );
      } else {
        return concatXXXX(
          node.init == null ? EMPTY : hoistExpression(node.init, digest, mode),
          node.test == null ? EMPTY : hoistExpression(node.test, digest, mode),
          node.update == null
            ? EMPTY
            : hoistExpression(node.update, digest, mode),
          hoistStatement(node.body, digest, mode),
        );
      }
    }
    case "ForInStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeBindingArray(
          BLOCK_SCOPING,
          concatXXX(
            hoistStatement(node.left, digest, mode),
            hoistExpression(node.right, digest, mode),
            hoistStatement(node.body, digest, mode),
          ),
          digest(node),
        );
      } else {
        return concatXXX(
          hoistPattern(node.left, null, digest, mode),
          hoistExpression(node.right, digest, mode),
          hoistStatement(node.body, digest, mode),
        );
      }
    }
    case "ForOfStatement": {
      if (node.left.type === "VariableDeclaration") {
        return scopeBindingArray(
          BLOCK_SCOPING,
          concatXXX(
            hoistStatement(node.left, digest, mode),
            hoistExpression(node.right, digest, mode),
            hoistStatement(node.body, digest, mode),
          ),
          digest(node),
        );
      } else {
        return concatXXX(
          hoistPattern(node.left, null, digest, mode),
          hoistExpression(node.right, digest, mode),
          hoistStatement(node.body, digest, mode),
        );
      }
    }
    case "BlockStatement": {
      return scopeBindingArray(
        BLOCK_SCOPING,
        flatMapIndex(node.body.length, (index) =>
          hoistStatement(node.body[index], digest, mode),
        ),
        digest(node),
      );
    }
    case "SwitchStatement": {
      // switch (0) { default: function x() {} }
      // x; >> reference error
      return scopeBindingArray(
        BLOCK_SCOPING,
        concatXX(
          hoistExpression(node.discriminant, digest, mode),
          flatMapIndex(node.cases.length, (index) =>
            hoistSwitchCase(node.cases[index], digest, mode),
          ),
        ),
        digest(node),
      );
    }
    case "TryStatement": {
      return concatXXX(
        hoistStatement(node.block, digest, mode),
        node.handler == null
          ? EMPTY
          : hoistCatchClause(node.handler, digest, mode),
        node.finalizer == null
          ? EMPTY
          : hoistStatement(node.finalizer, digest, mode),
      );
    }
    case "WithStatement": {
      return concatXX(
        hoistExpression(node.object, digest, mode),
        hoistStatement(node.body, digest, mode),
      );
    }
    case "ThrowStatement": {
      return hoistExpression(node.argument, digest, mode);
    }
    case "ExpressionStatement": {
      return hoistExpression(node.expression, digest, mode);
    }
    case "ReturnStatement": {
      return node.argument == null
        ? EMPTY
        : hoistExpression(node.argument, digest, mode);
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
 *   kind: import("./hoisting-private").Kind,
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
    kind === "error-legacy" ||
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
 *   kind: import("./hoisting-private").Kind,
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
    kind === "error-legacy" ||
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
 *   kind: import("./hoisting-private").Kind,
 * ) => import("./hoisting-public").SloppyFunction}
 */
const getSloppyFunction = (kind) => {
  if (kind === "function-sloppy-away") {
    return "away";
  } else if (kind === "function-sloppy-near") {
    return "near";
  } else if (
    kind === "error-legacy" ||
    kind === "var" ||
    kind === "function-strict" ||
    kind === "let" ||
    kind === "const" ||
    kind === "class" ||
    kind === "param" ||
    kind === "error" ||
    kind === "param-legacy" ||
    kind === "import"
  ) {
    return "nope";
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   binding: import("./hoisting-private").Binding,
 *   bindings: import("./hoisting-private").Binding[],
 * ) => boolean}
 */
const hasDualSloppyFunction = (binding, bindings) => {
  for (const other of bindings) {
    if (binding.origin === other.origin && binding.kind !== other.kind) {
      return other.type !== "void" && other.bind !== binding.bind;
    }
  }
  throw new AranExecError("missing dual sloppy function binding", {
    binding,
    bindings,
  });
};

/**
 * @type {(
 *   binding: import("./hoisting-private").Binding,
 *   bindings: import("./hoisting-private").Binding[],
 * ) => import("./hoisting-private").Kind}
 */
const updateBindingKind = (binding, bindings) => {
  if (
    binding.kind === "function-sloppy-near" ||
    binding.kind === "function-sloppy-away"
  ) {
    return hasDualSloppyFunction(binding, bindings) ? binding.kind : "var";
  } else {
    return binding.kind;
  }
};

/**
 * @type {(
 *   binding: (
 *     | import("./hoisting-private").FreeBinding
 *     | import("./hoisting-private").LockBinding
 *   ),
 *   bindings: import("./hoisting-private").Binding[],
 * ) => import("./hoisting-public").Binding}
 */
const toPublicBinding = (binding, bindings) => {
  const kind = updateBindingKind(binding, bindings);
  return {
    variable: binding.variable,
    write: getRegularWrite(kind),
    baseline: getRegularBaseline(kind),
    sloppy_function: getSloppyFunction(kind),
  };
};

/**
 * @type {(
 *   sloppy_function_1: import("./hoisting-public").SloppyFunction,
 *   sloppy_function_2: import("./hoisting-public").SloppyFunction,
 * ) => import("./hoisting-public").SloppyFunction}
 */
const mergeSloppyFunction = (sloppy_function_1, sloppy_function_2) => {
  if (sloppy_function_1 === "both" || sloppy_function_2 === "both") {
    return "both";
  }
  if (sloppy_function_1 === "nope") {
    return sloppy_function_2;
  }
  if (sloppy_function_2 === "nope") {
    return sloppy_function_1;
  }
  if (sloppy_function_1 === "near" && sloppy_function_2 === "near") {
    return "near";
  }
  if (sloppy_function_1 === "away" && sloppy_function_2 === "away") {
    return "away";
  }
  return "both";
};

/**
 * @type {(
 *   binding1: import("./hoisting-public").Binding,
 *   binding2: import("./hoisting-public").Binding,
 * ) => import("./hoisting-public").Binding}
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
 *   mode: import("./hoisting-private").Mode,
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
    return reportBinding(binding, "keyword");
  } else {
    return binding;
  }
};

/**
 * @type {(
 *   binding: import("./hoisting-private").FlagBinding,
 * ) => import("./hoisting-public").Error}
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
 *   node: import("../../estree").Program,
 *   kind: "module" | "eval" | "script",
 *   mode: import("./hoisting-private").Mode,
 *   digest: import("../../hash").Digest,
 * ) => {
 *   report: import("./hoisting-public").Error[],
 *   unbound: import("./hoisting-public").Binding[],
 *   hoisting: {
 *     [key in import("../../hash").Hash]
 *       ?: import("./hoisting-public").Binding[]
 *   },
 * }}
 */
export const annotateHoisting = (node, kind, mode, digest) => {
  const illegal = getIllegalRecord(mode);
  const bindings = map(hoistProgram(node, kind, digest, mode), (binding) =>
    reportIllegalBinding(binding, illegal),
  );
  /** @type {import("./hoisting-public").Binding[]} */
  const unbound = [];
  /**
   * @type {{
   *   [key in import("../../hash").Hash]
   *     ?: import("./hoisting-public").Binding[]
   * }}
   */
  const hoisting = /** @type {any} */ ({ __proto__: null });
  /** @type {import("./hoisting-public").Error[]} */
  const report = [];
  for (const binding of bindings) {
    if (binding.type === "flag") {
      report[report.length] = toError(binding);
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
