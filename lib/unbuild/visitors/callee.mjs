import { AranTypeError } from "../../error.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "../cache.mjs";
import { makeArrayExpression, makeBinaryExpression } from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  makeCallSuperExpression,
  makeReadThisExpression,
} from "../param/index.mjs";
import { unbuildChainMember, unbuildMember } from "./member.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { isNotOptionalMemberExpression } from "../predicate.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { drill } from "../site.mjs";

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   options: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeRegularCall = (callee, this_, arguments_, { path }) => {
  switch (arguments_.type) {
    case "spread": {
      return makeApplyExpression(callee, this_, arguments_.values, path);
    }
    case "concat": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.apply", path),
        makePrimitiveExpression({ undefined: null }, path),
        [callee, this_, arguments_.value],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid arguments", arguments_);
    }
  }
};

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   options: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeOptionalCall = (callee, this_, arguments_, { path, meta }) =>
  makeInitCacheExpression("constant", callee, { path, meta }, (callee) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "==",
        makeReadCacheExpression(callee, path),
        makePrimitiveExpression(null, path),
        path,
      ),
      makePrimitiveExpression({ undefined: null }, path),
      finalizeRegularCall(
        makeReadCacheExpression(callee, path),
        this_,
        arguments_,
        { path },
      ),
      path,
    ),
  );

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   options: {
 *     optional: boolean,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   }
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeCall = (callee, this_, arguments_, { optional, path, meta }) =>
  optional
    ? finalizeOptionalCall(callee, this_, arguments_, { path, meta })
    : finalizeRegularCall(callee, this_, arguments_, { path });

/**
 * @type {(
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const concatArgument = (arguments_, path) => {
  switch (arguments_.type) {
    case "spread": {
      return makeArrayExpression(arguments_.values, path);
    }
    case "concat": {
      return arguments_.value;
    }
    default: {
      throw new AranTypeError("invalid arguments", arguments_);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     node: estree.Expression | estree.Super,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         result: aran.Expression<unbuild.Atom>,
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *     optional: boolean,
 *     arguments: {
 *       type: "spread",
 *       values: aran.Expression<unbuild.Atom>[],
 *     } | {
 *       type: "concat",
 *       value: aran.Expression<unbuild.Atom>,
 *     }
 *   },
 *  ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildChainCallee = (
  { node, path, meta },
  context,
  { kontinue, optional, arguments: arguments_ },
) => {
  switch (node.type) {
    case "Super": {
      return makeCallSuperExpression(
        context,
        concatArgument(arguments_, path),
        { path, meta },
      );
    }
    case "ChainExpression": {
      // Not sure if nested chain expression are legal.
      // But it is easy to support here.
      return unbuildChainCallee(
        drill({ node, path, meta }, ["expression"]).expression,
        context,
        { kontinue, optional, arguments: arguments_ },
      );
    }
    case "MemberExpression": {
      return unbuildChainMember({ node, path, meta }, context, {
        object: true,
        kontinue: (context, { object, member: callee }) =>
          kontinue(context, {
            result: finalizeCall(
              callee,
              object === "super"
                ? makeReadThisExpression(context, { path })
                : object,
              arguments_,
              {
                optional,
                path,
                meta,
              },
            ),
          }),
      });
    }
    default: {
      return unbuildChainElement({ node, path, meta }, context, {
        kontinue: (context, { result: callee }) =>
          kontinue(context, {
            result: finalizeCall(
              callee,
              makePrimitiveExpression({ undefined: null }, path),
              arguments_,
              {
                optional,
                path,
                meta,
              },
            ),
          }),
      });
    }
  }
};

/**
 * @type {(
 *   site: {
 *     node: estree.Expression | estree.Super,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     arguments: {
 *       type: "spread",
 *       values: aran.Expression<unbuild.Atom>[],
 *     } | {
 *       type: "concat",
 *       value: aran.Expression<unbuild.Atom>,
 *     }
 *   },
 *  ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildCallee = (
  { node, path, meta },
  context,
  { arguments: arguments_ },
) => {
  switch (node.type) {
    case "Super": {
      return makeCallSuperExpression(
        context,
        concatArgument(arguments_, path),
        { path, meta },
      );
    }
    case "ChainExpression": {
      // Not sure if callee chain expression are legal.
      // But it is easy to support here.
      return unbuildChainCallee(
        drill({ node, path, meta }, ["expression"]).expression,
        context,
        {
          optional: false,
          arguments: arguments_,
          kontinue: (_context, { result }) => result,
        },
      );
    }
    case "MemberExpression": {
      if (isNotOptionalMemberExpression(node)) {
        return unbuildMember({ node, path, meta }, context, {
          object: true,
          kontinue: (context, { object, member: callee }) =>
            finalizeRegularCall(
              callee,
              object === "super"
                ? makeReadThisExpression(context, { path })
                : object,
              arguments_,
              { path },
            ),
        });
      } else {
        return makeSyntaxErrorExpression(
          "Illegal optional member outside of chain expression",
          path,
        );
      }
    }
    default: {
      return finalizeRegularCall(
        unbuildExpression({ node, path, meta }, context, {}),
        makePrimitiveExpression({ undefined: null }, path),
        arguments_,
        { path },
      );
    }
  }
};
