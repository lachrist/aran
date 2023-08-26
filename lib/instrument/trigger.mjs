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
 * @template X
 * @param {{dynamic: X}} object
 * @returns {X}
 */
export const getDynamic = ({ dynamic: x }) => x;

/** @type {(point: Point) => Expression[]} */
const listArgumentExpression = (point) => {
  switch (point.type) {
    case "eval.enter":
      return [
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, getDynamic)),
        point.serial.dynamic,
      ];
    case "eval.success":
      return [point.value, point.serial.dynamic];
    case "eval.failure":
      return [point.value, point.serial.dynamic];
    case "eval.leave":
      return [point.serial.dynamic];
    case "module.enter":
      return [
        makeArrayExpression(map(point.links, makeLinkExpression)),
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, getDynamic)),
        point.serial.dynamic,
      ];
    case "module.success":
      return [point.serial.dynamic];
    case "module.failure":
      return [point.value, point.serial.dynamic];
    case "module.leave":
      return [point.serial.dynamic];
    case "script.before":
      return [
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        point.serial.dynamic,
      ];
    case "script.after":
      return [point.value, point.serial.dynamic];
    case "closure.enter":
      return [
        makePrimitiveExpression(point.kind),
        point.callee,
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, getDynamic)),
        point.serial.dynamic,
      ];
    case "closure.success":
      return [point.serial.dynamic];
    case "closure.failure":
      return [point.value, point.serial.dynamic];
    case "closure.leave":
      return [point.serial.dynamic];
    case "block.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeArrayExpression(map(point.labels, getDynamic)),
        makeObjectExpression(
          makePrimitiveExpression(null),
          map(listEntry(point.parameters), makeObjectEntry),
        ),
        makeArrayExpression(map(point.variables, getDynamic)),
        point.serial.dynamic,
      ];
    case "block.success":
      return [point.serial.dynamic];
    case "block.failure":
      return [point.value, point.serial.dynamic];
    case "block.leave":
      return [point.serial.dynamic];
    case "return.before":
      return [point.value, point.serial.dynamic];
    case "break.before":
      return [point.label.dynamic, point.serial.dynamic];
    case "debugger.before":
      return [point.serial.dynamic];
    case "debugger.after":
      return [point.serial.dynamic];
    case "test.before":
      return [point.serial.dynamic];
    case "primitive.after":
      return [
        makePrimitiveExpression(packPrimitive(point.value)),
        point.serial.dynamic,
      ];
    case "parameter.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        point.serial.dynamic,
      ];
    case "intrinsic.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        point.serial.dynamic,
      ];
    case "import.after":
      return [
        makePrimitiveExpression(point.source),
        makePrimitiveExpression(point.specifier),
        point.value,
        point.serial.dynamic,
      ];
    case "closure.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.asynchronous),
        makePrimitiveExpression(point.generator),
        point.value,
        point.serial.dynamic,
      ];
    case "read.after":
      return [point.variable.dynamic, point.value, point.serial.dynamic];
    case "write.before":
      return [point.variable.dynamic, point.value, point.serial.dynamic];
    case "drop.before":
      return [point.value, point.serial.dynamic];
    case "export.before":
      return [
        makePrimitiveExpression(point.specifier),
        point.value,
        point.serial.dynamic,
      ];
    case "conditional.before":
      return [point.value, point.serial.dynamic];
    case "conditional.after":
      return [point.value, point.serial.dynamic];
    case "eval.before":
      return [point.value, point.serial.dynamic];
    case "eval.after":
      return [point.value, point.serial.dynamic];
    case "await.before":
      return [point.value, point.serial.dynamic];
    case "await.after":
      return [point.value, point.serial.dynamic];
    case "yield.before":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        point.serial.dynamic,
      ];
    case "yield.after":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        point.serial.dynamic,
      ];
    case "apply":
      return [
        point.callee,
        point.this,
        makeArrayExpression(point.arguments),
        point.serial.dynamic,
      ];
    case "construct":
      return [
        point.callee,
        makeArrayExpression(point.arguments),
        point.serial.dynamic,
      ];
    case "enclave.read.before":
      return [makePrimitiveExpression(point.variable), point.serial.dynamic];
    case "enclave.read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        point.serial.dynamic,
      ];
    case "enclave.typeof.before":
      return [makePrimitiveExpression(point.variable), point.serial.dynamic];
    case "enclave.typeof.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        point.serial.dynamic,
      ];
    case "enclave.write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        point.serial.dynamic,
      ];
    case "enclave.write.after":
      return [makePrimitiveExpression(point.variable), point.serial.dynamic];
    case "enclave.declare.before":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        point.value,
        point.serial.dynamic,
      ];
    case "enclave.declare.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        point.serial.dynamic,
      ];
    default:
      throw new StaticError("invalid point", point);
  }
};

/** @type {(advice: string, point: Point) => Expression} */
export const makeTriggerExpression = (advice, point) =>
  makeApplyExpression(
    makeGetExpression(
      makeReadExpression(advice),
      makePrimitiveExpression(point.type),
    ),
    makeReadExpression(advice),
    listArgumentExpression(point),
  );
