import {
  makeArrayExpression,
  makeGetExpression,
  makeObjectExpression,
} from "../intrinsic.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  packPrimitive,
} from "../syntax.mjs";

import { StaticError, map } from "../util/index.mjs";

const {
  Object: { entries: listEntry },
} = globalThis;

/**
 * @typedef {{
 *   makeSerialExpression: (path: string, serial: Json) =>  Expression,
 *   makeVariableExpression: (variable: Json) => Expression,
 *   makeLabelExpression: (label: Json) => Expression,
 * }} MakeDynamicArgument
 */

/** @type {(entry: [string, Expression]) => [Expression, Expression]} */
const makeObjectEntry = ([key, value]) => [makePrimitiveExpression(key), value];

/** @type {(link: LinkData) => Expression} */
const makeLinkExpression = (link) => {
  switch (link.type) {
    case "import":
      return makeObjectExpression(makeIntrinsicExpression("Object.prototype"), [
        [
          makePrimitiveExpression("source"),
          makePrimitiveExpression(link.source),
        ],
        [
          makePrimitiveExpression("import"),
          makePrimitiveExpression(link.import),
        ],
      ]);
    case "export":
      return makeObjectExpression(makeIntrinsicExpression("Object.prototype"), [
        [
          makePrimitiveExpression("export"),
          makePrimitiveExpression(link.export),
        ],
      ]);
    case "aggregate":
      return makeObjectExpression(makeIntrinsicExpression("Object.prototype"), [
        [
          makePrimitiveExpression("import"),
          makePrimitiveExpression(link.import),
        ],
        [
          makePrimitiveExpression("export"),
          makePrimitiveExpression(link.export),
        ],
      ]);
    default:
      throw new StaticError("invalid link", link);
  }
};

/**
 * @type {(
 *   point: Point,
 *   path: string,
 *   makers: MakeDynamicArgument,
 * ) => Expression[]}
 */
const listArgumentExpression = (
  point,
  path,
  { makeVariableExpression, makeLabelExpression, makeSerialExpression },
) => {
  switch (point.type) {
    case "eval.enter":
      return [
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, makeVariableExpression)),
        makeSerialExpression(path, point.serial),
      ];
    case "eval.success":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "eval.failure":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "eval.leave":
      return [makeSerialExpression(path, point.serial)];
    case "module.enter":
      return [
        makeArrayExpression(map(point.links, makeLinkExpression)),
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, makeVariableExpression)),
        makeSerialExpression(path, point.serial),
      ];
    case "module.success":
      return [makeSerialExpression(path, point.serial)];
    case "module.failure":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "module.leave":
      return [makeSerialExpression(path, point.serial)];
    case "script.before":
      return [
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeSerialExpression(path, point.serial),
      ];
    case "script.after":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "closure.enter":
      return [
        makePrimitiveExpression(point.kind),
        point.callee,
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, makeVariableExpression)),
        makeSerialExpression(path, point.serial),
      ];
    case "closure.success":
      return [makeSerialExpression(path, point.serial)];
    case "closure.failure":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "closure.leave":
      return [makeSerialExpression(path, point.serial)];
    case "block.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeArrayExpression(map(point.labels, makeLabelExpression)),
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, makeVariableExpression)),
        makeSerialExpression(path, point.serial),
      ];
    case "block.success":
      return [makeSerialExpression(path, point.serial)];
    case "block.failure":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "block.leave":
      return [makeSerialExpression(path, point.serial)];
    case "return.before":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "break.before":
      return [
        makeLabelExpression(point.label),
        makeSerialExpression(path, point.serial),
      ];
    case "debugger.before":
      return [makeSerialExpression(path, point.serial)];
    case "debugger.after":
      return [makeSerialExpression(path, point.serial)];
    case "test.before":
      return [makeSerialExpression(path, point.serial)];
    case "primitive.after":
      return [
        makePrimitiveExpression(packPrimitive(point.value)),
        makeSerialExpression(path, point.serial),
      ];
    case "parameter.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "intrinsic.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "import.after":
      return [
        makePrimitiveExpression(point.source),
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "closure.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.asynchronous),
        makePrimitiveExpression(point.generator),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "read.after":
      return [
        makeVariableExpression(point.variable),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "write.before":
      return [
        makeVariableExpression(point.variable),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "drop.before":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "export.before":
      return [
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "conditional.before":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "conditional.after":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "eval.before":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "eval.after":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "await.before":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "await.after":
      return [point.value, makeSerialExpression(path, point.serial)];
    case "yield.before":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "yield.after":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "apply":
      return [
        point.callee,
        point.this,
        makeArrayExpression(point.arguments),
        makeSerialExpression(path, point.serial),
      ];
    case "construct":
      return [
        point.callee,
        makeArrayExpression(point.arguments),
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.read.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.typeof.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.typeof.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.write.after":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.declare.before":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(path, point.serial),
      ];
    case "enclave.declare.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        makeSerialExpression(path, point.serial),
      ];
    default:
      throw new StaticError("invalid point", point);
  }
};

/**
 * @type {(
 *   advice: string,
 *   point: Point,
 *   path: string,
 *   makers: MakeDynamicArgument,
 * ) => Expression}
 */
export const makeTriggerExpression = (advice, point, path, makers) =>
  makeApplyExpression(
    makeGetExpression(
      makeReadExpression(advice),
      makePrimitiveExpression(point.type),
    ),
    makeReadExpression(advice),
    listArgumentExpression(point, path, makers),
  );
