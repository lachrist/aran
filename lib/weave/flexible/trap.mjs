import { concat__X, concat_X, concat_XX, map } from "../../util/index.mjs";
import { makeJsonExpression } from "../json.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeReadExpression,
} from "../node.mjs";
import { mangleAdviceVariable, mangleStateVariable } from "../variable.mjs";

/**
 * @type {(
 *   name: import("estree-sentry").VariableName,
 *   input: import("../atom").ResExpression[],
 *   tag: import("../atom").Tag,
 * ) => import("../atom").ResExpression}
 */
const makeTrapExpression = (name, input, tag) =>
  makeApplyExpression(
    makeReadExpression(mangleAdviceVariable(name), tag),
    makeIntrinsicExpression("undefined", tag),
    input,
    tag,
  );

/**
 * @type {(
 *   point: import("../../util/util").Json[],
 *   tag: import("../atom").Tag,
 * ) => import("../atom").ResExpression[]}
 */
const listPointExpression = (point, tag) =>
  map(point, (json) => makeJsonExpression(json, tag));

///////////
// Block //
///////////

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").BlockTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").BlockPredicate,
 * ) => import("../atom").ResExpression}
 */
export const trapBlockState = (
  result,
  { origin, parent },
  { root },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(
      name,
      concat_X(result, listPointExpression(point, tag)),
      tag,
    );
  }
};

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").BlockTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").BlockPredicate,
 * ) => import("../atom").ResExpression}
 */
export const trapBlockResult = (
  result,
  { origin, parent },
  { root, depth },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(
      name,
      concat__X(
        makeReadExpression(mangleStateVariable(depth), tag),
        result,
        listPointExpression(point, tag),
      ),
      tag,
    );
  }
};

/**
 * @type {(
 *   infos: import("../atom").ResExpression[],
 *   target: import("./target").BlockTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").BlockPredicate,
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
export const trapBlockNotif = (
  infos,
  { origin, parent },
  { root, depth },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(
        name,
        concat_XX(
          makeReadExpression(mangleStateVariable(depth), tag),
          infos,
          listPointExpression(point, tag),
        ),
        tag,
      ),
      tag,
    );
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").StatementPredicate,
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
export const trapStatementNotif = (
  { origin, parent },
  { root, depth },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(
        name,
        concat_X(
          makeReadExpression(mangleStateVariable(depth), tag),
          listPointExpression(point, tag),
        ),
        tag,
      ),
      tag,
    );
  }
};

////////////
// Effect //
////////////

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").EffectPredicate,
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
export const trapEffectNotif = (
  { origin, parent },
  { root, depth },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(
        name,
        concat_X(
          makeReadExpression(mangleStateVariable(depth), tag),
          listPointExpression(point, tag),
        ),
        tag,
      ),
      tag,
    );
  }
};

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").ExpressionPredicate,
 * ) => import("../../util/tree").Tree<import("../atom").ResEffect>}
 */
export const trapExpressionNotif = (
  { origin, parent },
  { root, depth },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeExpressionEffect(
      makeTrapExpression(
        name,
        concat_X(
          makeReadExpression(mangleStateVariable(depth), tag),
          listPointExpression(point, tag),
        ),
        tag,
      ),
      tag,
    );
  }
};

/**
 * @type {(
 *   result: import("../atom").ResExpression,
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").ExpressionPredicate,
 * ) => import("../atom").ResExpression}
 */
export const trapExpressionResult = (
  result,
  { origin, parent },
  { root, depth },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return result;
  } else {
    return makeTrapExpression(
      name,
      concat__X(
        makeReadExpression(mangleStateVariable(depth), tag),
        result,
        listPointExpression(point, tag),
      ),
      tag,
    );
  }
};

/**
 * @type {(
 *   input: import("../atom").ResExpression[],
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 *   predicate: import("./aspect-internal").ExpressionPredicate,
 * ) => null | import("../atom").ResExpression}
 */
export const trapExpressionAround = (
  input,
  { origin, parent },
  { root, depth },
  { name, pointcut },
) => {
  const { tag } = origin;
  const point = pointcut(origin, parent, root);
  if (point == null) {
    return null;
  } else {
    return makeTrapExpression(
      name,
      concat_XX(
        makeReadExpression(mangleStateVariable(depth), tag),
        input,
        listPointExpression(point, tag),
      ),
      tag,
    );
  }
};
