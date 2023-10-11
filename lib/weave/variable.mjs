import { isParameter } from "../lang.mjs";
import { makeReadExpression, makeWriteEffect } from "./node.mjs";

///////////
// Frame //
///////////

export const FRAME_VARIABLE = /** @type {weave.ResVariable} */ ("frame");

/** @type {weave.Binding} */
const FRAME_BINDING = { type: "frame" };

/**
 * @type {() => aran.Expression<weave.ResAtom>}
 */
export const makeReadFrameExpression = () =>
  makeReadExpression(FRAME_VARIABLE, FRAME_BINDING);

/**
 * @type {(
 *   right: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeWriteFrameEffect = (right) =>
  makeWriteEffect(FRAME_VARIABLE, right, FRAME_BINDING);

////////////////
// Completion //
////////////////

export const COMPLETION_VARIABLE = /** @type {weave.ResVariable} */ (
  "completion"
);

/** @type {weave.Binding} */
const COMPLETION_BINDING = { type: "frame" };

/**
 * @type {() => aran.Expression<weave.ResAtom>}
 */
export const makeReadCompletionExpression = () =>
  makeReadExpression(COMPLETION_VARIABLE, COMPLETION_BINDING);

/**
 * @type {(
 *   right: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeWriteCompletionEffect = (right) =>
  makeWriteEffect(COMPLETION_VARIABLE, right, COMPLETION_BINDING);

//////////////
// Original //
//////////////

const ORIGINAL_PREFIX = "original";

/**
 * @type {(
 *   variable: aran.Parameter | weave.ArgVariable,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeReadOriginalExpression = (variable) =>
  isParameter(variable)
    ? makeReadExpression(variable, null)
    : makeReadExpression(
        /** @type {weave.ResVariable} */ (`${ORIGINAL_PREFIX}.${variable}`),
        {
          type: "original",
          name: variable,
        },
      );

/**
 * @type {(
 *   variable: aran.Parameter | weave.ArgVariable,
 *   right: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeWriteOriginalEffect = (variable, right) =>
  isParameter(variable)
    ? makeWriteEffect(variable, right, null)
    : makeWriteEffect(
        /** @type {weave.ResVariable} */ (`${ORIGINAL_PREFIX}.${variable}`),
        right,
        {
          type: "original",
          name: variable,
        },
      );

////////////
// Callee //
////////////

const CALLEE_PREFIX = "callee";

/**
 * @type {(
 *   path: weave.TargetPath,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeReadCalleeExpression = (path) =>
  makeReadExpression(
    /** @type {weave.ResVariable} */ (`${CALLEE_PREFIX}.${path}`),
    {
      type: "callee",
      path,
    },
  );

/**
 * @type {(
 *   path: weave.TargetPath,
 *   right: aran.Expression<weave.ResAtom>,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeWriteCalleeEffect = (path, right) =>
  makeWriteEffect(
    /** @type {weave.ResVariable} */ (`${CALLEE_PREFIX}.${path}`),
    right,
    {
      type: "callee",
      path,
    },
  );

//////////////
// Location //
//////////////

const LOCATION_PREFIX = "location";

/**
 * @type {(
 *   path: weave.TargetPath,
 *   init: Json,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeReadLocationExpression = (path, init) =>
  makeReadExpression(
    /** @type {weave.ResVariable} */ (`${LOCATION_PREFIX}.${path}`),
    {
      type: "location",
      init,
      path,
    },
  );

/**
 * @type {(
 *   path: weave.TargetPath,
 *   right: aran.Expression<weave.ResAtom>,
 *   init: Json,
 * ) => aran.Effect<weave.ResAtom>}
 */
export const makeWriteLocationEffect = (path, right, init) =>
  makeWriteEffect(
    /** @type {weave.ResVariable} */ (`${LOCATION_PREFIX}.${path}`),
    right,
    {
      type: "location",
      init,
      path,
    },
  );
