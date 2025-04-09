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
 *   input: import("../atom.d.ts").ResExpression[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
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
 *   point: import("../../util/util.d.ts").Json[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression[]}
 */
const listPointExpression = (point, tag) =>
  map(point, (json) => makeJsonExpression(json, tag));

///////////
// Block //
///////////

/**
 * @type {(
 *   result: import("../atom.d.ts").ResExpression,
 *   target: import("./target.d.ts").BlockTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").BlockPredicate,
 * ) => import("../atom.d.ts").ResExpression}
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
 *   result: import("../atom.d.ts").ResExpression,
 *   target: import("./target.d.ts").BlockTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").BlockPredicate,
 * ) => import("../atom.d.ts").ResExpression}
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
 *   infos: import("../atom.d.ts").ResExpression[],
 *   target: import("./target.d.ts").BlockTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").BlockPredicate,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
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
 *   target: import("./target.d.ts").StatementTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").StatementPredicate,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
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
 *   target: import("./target.d.ts").EffectTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").EffectPredicate,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
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
 *   target: import("./target.d.ts").ExpressionTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").ExpressionPredicate,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
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
 *   result: import("../atom.d.ts").ResExpression,
 *   target: import("./target.d.ts").ExpressionTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").ExpressionPredicate,
 * ) => import("../atom.d.ts").ResExpression}
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
 *   input: import("../atom.d.ts").ResExpression[],
 *   target: import("./target.d.ts").ExpressionTarget,
 *   context: import("./context.d.ts").Context,
 *   predicate: import("./aspect-internal.d.ts").ExpressionPredicate,
 * ) => null | import("../atom.d.ts").ResExpression}
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
