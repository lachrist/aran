import { makeIntrinsicExpression, makeReadExpression } from "./node.mjs";
import { reduceEntry, map } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";
import { hasEvalCall, hasParameter } from "../query.mjs";

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
const prepareVariableBinding = ([variable, intrinsic]) => [
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
        ...reduceEntry(map(record, prepareVariableBinding)),
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
      record: reduceEntry(map(record, prepareVariableBinding)),
    };
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   dynamic: boolean,
 *   root: import("./atom").ArgProgram,
 * ) => import("./atom").ResExpression}
 */
const makeOptionalInitializer = (parameter, dynamic, root) => {
  if (dynamic || hasParameter(root, parameter)) {
    return makeReadExpression(parameter);
  } else {
    return makeIntrinsicExpression("undefined");
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
              ...reduceEntry(map(record, prepareVariableBinding)),
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
              ...reduceEntry(map(record, prepareVariableBinding)),
            },
          };
        }
        default: {
          throw new AranTypeError(parent);
        }
      }
    }
    case "Program": {
      const dynamic = hasEvalCall(parent);
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
              "import.dynamic": makeOptionalInitializer(
                "import.dynamic",
                dynamic,
                parent,
              ),
              "scope.read": makeOptionalInitializer(
                "scope.read",
                dynamic,
                parent,
              ),
              "scope.write": makeOptionalInitializer(
                "scope.write",
                dynamic,
                parent,
              ),
              "scope.typeof": makeOptionalInitializer(
                "scope.typeof",
                dynamic,
                parent,
              ),
              "scope.discard": makeOptionalInitializer(
                "scope.discard",
                dynamic,
                parent,
              ),
              ...reduceEntry(map(record, prepareVariableBinding)),
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
              "import.dynamic": makeOptionalInitializer(
                "import.dynamic",
                dynamic,
                parent,
              ),
              "scope.read": makeOptionalInitializer(
                "scope.read",
                dynamic,
                parent,
              ),
              "scope.write": makeOptionalInitializer(
                "scope.write",
                dynamic,
                parent,
              ),
              "scope.typeof": makeOptionalInitializer(
                "scope.typeof",
                dynamic,
                parent,
              ),
              "scope.discard": makeOptionalInitializer(
                "scope.discard",
                dynamic,
                parent,
              ),
              ...reduceEntry(map(record, prepareVariableBinding)),
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
                  "import.dynamic": makeOptionalInitializer(
                    "import.dynamic",
                    dynamic,
                    parent,
                  ),
                  "scope.read": makeOptionalInitializer(
                    "scope.read",
                    dynamic,
                    parent,
                  ),
                  "scope.write": makeOptionalInitializer(
                    "scope.write",
                    dynamic,
                    parent,
                  ),
                  "scope.typeof": makeOptionalInitializer(
                    "scope.typeof",
                    dynamic,
                    parent,
                  ),
                  "scope.discard": makeOptionalInitializer(
                    "scope.discard",
                    dynamic,
                    parent,
                  ),
                  ...reduceEntry(map(record, prepareVariableBinding)),
                },
              };
            }
            case "local.deep": {
              return {
                type: "program",
                kind: parent.kind,
                situ: parent.situ,
                head: parent.head,
                record: reduceEntry(map(record, prepareVariableBinding)),
              };
            }
            case "local.root": {
              return {
                type: "program",
                kind: parent.kind,
                situ: parent.situ,
                head: parent.head,
                record: {
                  "this": makeOptionalInitializer("this", dynamic, parent),
                  "import.dynamic": makeOptionalInitializer(
                    "import.dynamic",
                    dynamic,
                    parent,
                  ),
                  "import.meta": makeOptionalInitializer(
                    "import.meta",
                    dynamic,
                    parent,
                  ),
                  "new.target": makeOptionalInitializer(
                    "new.target",
                    dynamic,
                    parent,
                  ),
                  "private.has": makeOptionalInitializer(
                    "private.has",
                    dynamic,
                    parent,
                  ),
                  "private.get": makeOptionalInitializer(
                    "private.get",
                    dynamic,
                    parent,
                  ),
                  "private.set": makeOptionalInitializer(
                    "private.set",
                    dynamic,
                    parent,
                  ),
                  "scope.read": makeOptionalInitializer(
                    "scope.read",
                    dynamic,
                    parent,
                  ),
                  "scope.write": makeOptionalInitializer(
                    "scope.write",
                    dynamic,
                    parent,
                  ),
                  "scope.typeof": makeOptionalInitializer(
                    "scope.typeof",
                    dynamic,
                    parent,
                  ),
                  "scope.discard": makeOptionalInitializer(
                    "scope.discard",
                    dynamic,
                    parent,
                  ),
                  "super.get": makeOptionalInitializer(
                    "super.get",
                    dynamic,
                    parent,
                  ),
                  "super.set": makeOptionalInitializer(
                    "super.set",
                    dynamic,
                    parent,
                  ),
                  "super.call": makeOptionalInitializer(
                    "super.call",
                    dynamic,
                    parent,
                  ),
                  ...reduceEntry(map(record, prepareVariableBinding)),
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
