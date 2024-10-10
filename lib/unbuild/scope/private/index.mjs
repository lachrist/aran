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

/**
 * @type {import("../perform").Extend<
 *   import(".").PrivateScope,
 *   import(".").RawPrivateFrame,
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 * >}
 */
export const extendPrivate = (hash, meta, scope, raw_frame) =>
  mapSequence(setupPrivateFrame(hash, meta, raw_frame), (frame) => ({
    ...scope,
    private: [frame, scope.private],
  }));

/**
 * @type {<O, W1, W2, X>(
 *   performFrame: import("../perform").Perform<
 *     import(".").PrivateFrame,
 *     O,
 *     null | import("../../../sequence").Sequence<W1, X>
 *   >,
 *   performRoot: import("../perform").Perform<
 *     Omit<import(".").PrivateScope, "private">,
 *     O,
 *     import("../../../sequence").Sequence<W2, X>,
 *   >,
 * ) => import("../perform").Perform<
 *   import(".").PrivateScope,
 *   O,
 *   import("../../../sequence").Sequence<W1 | W2, X>,
 * >}
 */
export const compilePrivateOperation =
  (performFrame, performRoot) => (hash, meta, scope, operation) => {
    const match = lookupTree(scope.private, (frame) =>
      performFrame(hash, meta, frame, operation),
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
