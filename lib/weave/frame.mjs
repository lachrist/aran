import {
  makeApplyExpression,
  makeClosureBlock,
  makeClosureExpression,
  makeConditionalEffect,
  makeControlBlock,
  makeEvalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeReturnStatement,
  makeTryStatement,
  makeConstructExpression,
  makeExpressionEffect,
} from "./node.mjs";
import {
  reduceEntry,
  map,
  listKey,
  isNotNull,
  filterNarrow,
} from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";
import { hasEvalCall, hasParameter } from "../query.mjs";

/**
 * @type {(
 *   code: string,
 * ) => import("./atom").ResExpression}
 */
const prepare = (code) =>
  makeApplyExpression(
    makeClosureExpression(
      "arrow",
      false,
      false,
      makeClosureBlock(
        [],
        [
          makeTryStatement(
            makeControlBlock(
              [],
              [],
              [
                makeReturnStatement(
                  makeEvalExpression(makePrimitiveExpression(code)),
                ),
              ],
            ),
            makeControlBlock(
              [],
              [],
              [makeReturnStatement(makeIntrinsicExpression("aran.deadzone"))],
            ),
            makeControlBlock([], [], []),
          ),
        ],
        makePrimitiveExpression("unreachable"),
      ),
    ),
    makeIntrinsicExpression("undefined"),
    [],
  );

const precomp = {
  "import.meta": prepare("(import.meta);"),
  "new.target": prepare("(new.target);"),
  "super.get": prepare("((key) => super[key]);"),
  "super.set": prepare("((key, val) => super[key] = val);"),
  "super.call": prepare("((...args) => super(...args));"),
};

const unsafe = listKey(precomp);

/**
 * @type {(
 *   parameter: keyof precomp,
 *   dynamic: boolean,
 *   root: import("./atom").ArgProgram,
 * ) => import("./atom").ResExpression}
 */
const makeUnsafeParameterInitialExpression = (parameter, dynamic, root) => {
  if (hasParameter(root, parameter)) {
    return makeReadExpression(parameter);
  } else if (dynamic) {
    return precomp[parameter];
  } else {
    return makeIntrinsicExpression("undefined");
  }
};

/**
 * @type {(
 *   parameter: keyof precomp,
 * ) => import("./atom").ResEffect}
 */
const makeUnsafeParameterEarlyEffect = (parameter) =>
  makeConditionalEffect(
    makeApplyExpression(
      makeIntrinsicExpression("aran.binary"),
      makeIntrinsicExpression("undefined"),
      [
        makePrimitiveExpression("==="),
        makeReadExpression(parameter),
        makeIntrinsicExpression("aran.deadzone"),
      ],
    ),
    [
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("aran.throw"),
          makeIntrinsicExpression("undefined"),
          [
            makeConstructExpression(makePrimitiveExpression("SyntaxError"), [
              makePrimitiveExpression(`illegal access to ${parameter}`),
            ]),
          ],
        ),
      ),
    ],
    [],
  );

/**
 * @type {(
 *   root: import("./atom").ArgProgram,
 * ) => import("./atom").ResEffect[]}
 */
export const listUnsafeParameterEarlyEffect = (root) => {
  switch (root.situ) {
    case "global": {
      return [];
    }
    case "local.deep": {
      return filterNarrow(
        map(unsafe, (parameter) =>
          hasParameter(root, parameter)
            ? makeUnsafeParameterEarlyEffect(parameter)
            : null,
        ),
        isNotNull,
      );
    }
    case "local.root": {
      return [];
    }
    default: {
      throw new AranTypeError(root);
    }
  }
};

/**
 * @type {(
 *   entry: [
 *     import("./atom").ArgVariable,
 *     aran.Intrinsic,
 *   ],
 * ) => [
 *   import("./atom").ArgVariable,
 *   import("./atom").ResExpression,
 * ]}
 */
const prepareBinding = ([variable, intrinsic]) => [
  variable,
  makeIntrinsicExpression(intrinsic),
];

/**
 * @type {(
 *   kind: import("./point").ControlKind,
 *   labels: import("./atom").Label[],
 *   record: [
 *     import("./atom").ArgVariable,
 *     aran.Intrinsic,
 *   ][],
 * ) => import("./frame").Frame<import("./atom").ResExpression>}
 */
export const makeControlFrame = (kind, labels, record) => {
  if (kind === "catch") {
    return {
      type: "control",
      kind,
      labels,
      record: {
        "catch.error": makeReadExpression("catch.error"),
        ...reduceEntry(map(record, prepareBinding)),
      },
    };
  } else if (
    kind === "try" ||
    kind === "finally" ||
    kind === "naked" ||
    kind === "then" ||
    kind === "else" ||
    kind === "loop"
  ) {
    return {
      type: "control",
      kind,
      labels,
      record: reduceEntry(map(record, prepareBinding)),
    };
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   parent: (
 *     | import("./atom").ArgProgram
 *     | (import("./atom").ArgExpression & { type: "ClosureExpression" })
 *   ),
 *   record: [
 *     import("./atom").ArgVariable,
 *     aran.Intrinsic,
 *   ][],
 * ) => import("./frame").Frame<import("./atom").ResExpression>}
 */
export const makeClosureFrame = (parent, record) => {
  switch (parent.type) {
    case "ClosureExpression": {
      switch (parent.kind) {
        case "arrow": {
          return {
            type: "closure",
            kind: parent.kind,
            asynchronous: parent.asynchronous,
            generator: parent.generator,
            record: {
              "function.callee": makeReadExpression("function.callee"),
              "function.arguments": makeReadExpression("function.arguments"),
              ...reduceEntry(map(record, prepareBinding)),
            },
          };
        }
        case "function": {
          return {
            type: "closure",
            kind: parent.kind,
            asynchronous: parent.asynchronous,
            generator: parent.generator,
            record: {
              "function.callee": makeReadExpression("function.callee"),
              "new.target": makeReadExpression("new.target"),
              "this": makeReadExpression("this"),
              "function.arguments": makeReadExpression("function.arguments"),
              ...reduceEntry(map(record, prepareBinding)),
            },
          };
        }
        default: {
          throw new AranTypeError(parent);
        }
      }
    }
    case "Program": {
      switch (parent.kind) {
        case "module": {
          return {
            type: "program",
            kind: parent.kind,
            situ: parent.situ,
            head: parent.head,
            record: {
              "this": makeReadExpression("this"),
              "import.meta": makeReadExpression("import.meta"),
              "import.dynamic": makeReadExpression("import.dynamic"),
              "scope.read": makeReadExpression("scope.read"),
              "scope.write": makeReadExpression("scope.write"),
              "scope.typeof": makeReadExpression("scope.typeof"),
              "scope.discard": makeReadExpression("scope.discard"),
              ...reduceEntry(map(record, prepareBinding)),
            },
          };
        }
        case "script": {
          return {
            type: "program",
            kind: parent.kind,
            situ: parent.situ,
            head: parent.head,
            record: {
              "this": makeReadExpression("this"),
              "import.dynamic": makeReadExpression("import.dynamic"),
              "scope.read": makeReadExpression("scope.read"),
              "scope.write": makeReadExpression("scope.write"),
              "scope.typeof": makeReadExpression("scope.typeof"),
              "scope.discard": makeReadExpression("scope.discard"),
              ...reduceEntry(map(record, prepareBinding)),
            },
          };
        }
        case "eval": {
          switch (parent.situ) {
            case "global": {
              return {
                type: "program",
                kind: parent.kind,
                situ: parent.situ,
                head: parent.head,
                record: {
                  "this": makeReadExpression("this"),
                  "import.dynamic": makeReadExpression("import.dynamic"),
                  "scope.read": makeReadExpression("scope.read"),
                  "scope.write": makeReadExpression("scope.write"),
                  "scope.typeof": makeReadExpression("scope.typeof"),
                  "scope.discard": makeReadExpression("scope.discard"),
                  ...reduceEntry(map(record, prepareBinding)),
                },
              };
            }
            case "local.deep": {
              return {
                type: "program",
                kind: parent.kind,
                situ: parent.situ,
                head: parent.head,
                record: reduceEntry(map(record, prepareBinding)),
              };
            }
            case "local.root": {
              const dynamic = hasEvalCall(parent);
              return {
                type: "program",
                kind: parent.kind,
                situ: parent.situ,
                head: parent.head,
                record: {
                  "this": makeReadExpression("this"),
                  "private.has": makeReadExpression("private.has"),
                  "private.get": makeReadExpression("private.get"),
                  "private.set": makeReadExpression("private.set"),
                  "import.dynamic": makeReadExpression("import.dynamic"),
                  "scope.read": makeReadExpression("scope.read"),
                  "scope.write": makeReadExpression("scope.write"),
                  "scope.typeof": makeReadExpression("scope.typeof"),
                  "scope.discard": makeReadExpression("scope.discard"),
                  "super.get": makeUnsafeParameterInitialExpression(
                    "super.get",
                    dynamic,
                    parent,
                  ),
                  "super.set": makeUnsafeParameterInitialExpression(
                    "super.set",
                    dynamic,
                    parent,
                  ),
                  "super.call": makeUnsafeParameterInitialExpression(
                    "super.call",
                    dynamic,
                    parent,
                  ),
                  "import.meta": makeUnsafeParameterInitialExpression(
                    "super.call",
                    dynamic,
                    parent,
                  ),
                  "new.target": makeUnsafeParameterInitialExpression(
                    "new.target",
                    dynamic,
                    parent,
                  ),
                  ...reduceEntry(map(record, prepareBinding)),
                },
              };
            }
            default: {
              throw new AranTypeError(parent);
            }
          }
        }
        default: {
          throw new AranTypeError(parent);
        }
      }
    }
    default: {
      throw new AranTypeError(parent);
    }
  }
};
