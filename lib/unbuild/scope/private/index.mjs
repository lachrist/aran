import { mapSequence } from "../../../sequence.mjs";
import { lookupTree } from "../../../util/index.mjs";
import {
  listFramePrivateRegisterCollectionEffect,
  listFramePrivateRegisterSingletonEffect,
  listFramePrivateSetEffect,
  makeFramePrivateGetExpression,
  makeFramePrivateHasExpression,
  setupPrivateFrame,
} from "./frame.mjs";
import {
  listRootPrivateRegisterCollectionEffect,
  listRootPrivateRegisterSingletonEffect,
  listRootSetPrivateEffect,
  makeRootGetPrivateExpression,
  makeRootHasPrivateExpression,
} from "./root.mjs";

export const INITIAL_PRIVATE = null;

/**
 * @type {import("../api").Extend<
 *   import(".").RawPrivateFrame,
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").PrivateScope,
 * >}
 */
export const extendPrivate = (hash, meta, scope, raw_frame) =>
  mapSequence(setupPrivateFrame(hash, meta, raw_frame), (frame) => ({
    ...scope,
    private: [frame, scope.private],
  }));

/**
 * @type {<O, W1, W2, X>(
 *   performNode: import("../api").PerformMaybe<
 *     import(".").PrivateFrame,
 *     O,
 *     W1,
 *     X,
 *   >,
 *   performRoot: import("../api").Perform<
 *     {
 *       root: import("../../sort").RootSort,
 *       mode: import("../../mode").Mode,
 *     },
 *     O,
 *     W2,
 *     X,
 *   >,
 * ) => import("../api").Perform<
 *   import(".").PrivateScope,
 *   O,
 *   W1 | W2,
 *   X,
 * >}
 */
export const compilePrivateOperation =
  (performNode, performRoot) => (hash, meta, scope, operation) => {
    const match = lookupTree(scope.private, (frame) =>
      performNode(hash, meta, frame, operation),
    );
    if (match === null) {
      return performRoot(hash, meta, scope, operation);
    } else {
      return match;
    }
  };

export const makePrivateGetExpression = compilePrivateOperation(
  makeFramePrivateGetExpression,
  makeRootGetPrivateExpression,
);

export const makePrivateHasExpression = compilePrivateOperation(
  makeFramePrivateHasExpression,
  makeRootHasPrivateExpression,
);

export const listPrivateSetEffect = compilePrivateOperation(
  listFramePrivateSetEffect,
  listRootSetPrivateEffect,
);

export const listRegisterPrivateCollectionEffect = compilePrivateOperation(
  listFramePrivateRegisterCollectionEffect,
  listRootPrivateRegisterCollectionEffect,
);

export const listRegisterPrivateSingletonEffect = compilePrivateOperation(
  listFramePrivateRegisterSingletonEffect,
  listRootPrivateRegisterSingletonEffect,
);
