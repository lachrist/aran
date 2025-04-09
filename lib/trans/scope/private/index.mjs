import { findMapTree, mapSequence } from "../../../util/index.mjs";
import {
  listFrameDefinePrivateEffect,
  listFrameInitializePrivateEffect,
  listFrameRegisterCollectionPrivateEffect,
  listFrameRegisterSingletonPrivateEffect,
  listFrameSetPrivateEffect,
  makeFrameGetPrivateExpression,
  makeFrameHasPrivateExpression,
  setupPrivateFrame,
} from "./frame.mjs";
import {
  listRootIllegalPrivateEffect,
  listRootSetPrivateEffect,
  makeRootGetPrivateExpression,
  makeRootHasPrivateExpression,
} from "./root.mjs";

export const INITIAL_PRIVATE = null;

/**
 * @type {import("../api.d.ts").Extend<
 *   import("./index.d.ts").RawPrivateFrame,
 *   (
 *     | import("../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../prelude/index.d.ts").SyntaxErrorPrelude
 *     | import("../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").PrivateScope,
 * >}
 */
export const extendPrivate = (hash, meta, raw_frame, scope) =>
  mapSequence(setupPrivateFrame(hash, meta, raw_frame), (frame) => ({
    ...scope,
    private: [frame, scope.private],
  }));

/**
 * @type {<O, W1, W2, X>(
 *   performNode: import("../api.d.ts").PerformMaybe<
 *     import("./index.d.ts").PrivateFrame,
 *     O,
 *     W1,
 *     X,
 *   >,
 *   performRoot: import("../api.d.ts").Perform<
 *     {
 *       root: import("../../sort.d.ts").RootSort,
 *       mode: import("../../mode.d.ts").Mode,
 *     },
 *     O,
 *     W2,
 *     X,
 *   >,
 * ) => import("../api.d.ts").Perform<
 *   import("./index.d.ts").PrivateScope,
 *   O,
 *   W1 | W2,
 *   X,
 * >}
 */
export const compilePrivate =
  (performNode, performRoot) => (hash, meta, scope, operation) => {
    const match = findMapTree(scope.private, (frame) =>
      performNode(hash, meta, frame, operation),
    );
    if (match === null) {
      return performRoot(hash, meta, scope, operation);
    } else {
      return match;
    }
  };

/**
 * @type {(
 *   target: import("../../atom.d.ts").Expression,
 *   key: import("estree-sentry").PrivateKeyName,
 * ) => import("./index.d.ts").GetPrivateOperation}
 */
export const makeGetPrivateOperation = (target, key) => ({
  target,
  key,
});

export const makeGetPrivateExpression = compilePrivate(
  makeFrameGetPrivateExpression,
  makeRootGetPrivateExpression,
);

/**
 * @type {(
 *   target: import("../../atom.d.ts").Expression,
 *   key: import("estree-sentry").PrivateKeyName,
 * ) => import("./index.d.ts").HasPrivateOperation}
 */
export const makeHasPrivateOperation = (target, key) => ({
  target,
  key,
});

export const makeHasPrivateExpression = compilePrivate(
  makeFrameHasPrivateExpression,
  makeRootHasPrivateExpression,
);

/**
 * @type {(
 *   kind: "method" | "getter" | "setter",
 *   key: import("estree-sentry").PrivateKeyName,
 *   value: import("../../atom.d.ts").Expression,
 * ) => import("./index.d.ts").InitializePrivateOperation}
 */
export const makeInitializePrivateOperation = (kind, key, value) => ({
  kind,
  key,
  value,
});

export const listInitializePrivateEffect = compilePrivate(
  listFrameInitializePrivateEffect,
  listRootIllegalPrivateEffect,
);

/**
 * @type {(
 *   kind: "method" | "getter" | "setter",
 *   key: import("estree-sentry").PrivateKeyName,
 *   value: import("../../atom.d.ts").Expression,
 * ) => import("./index.d.ts").InitializePrivateOperation}
 */
export const makeSetPrivateOperation = (kind, key, value) => ({
  kind,
  key,
  value,
});

export const listSetPrivateEffect = compilePrivate(
  listFrameSetPrivateEffect,
  listRootSetPrivateEffect,
);

/**
 * @type {(
 *   target: import("../../atom.d.ts").Expression,
 * ) => import("./index.d.ts").RegisterCollectionPrivateOperation}
 */
export const makeRegisterCollectionPrivateOperation = (target) => ({
  target,
});

export const listRegisterCollectionPrivateEffect = compilePrivate(
  listFrameRegisterCollectionPrivateEffect,
  listRootIllegalPrivateEffect,
);

/**
 * @type {(
 *   target: import("../../atom.d.ts").Expression,
 * ) => import("./index.d.ts").RegisterSingletonPrivateOperation}
 */
export const makeRegisterSingletonPrivateOperation = (target) => ({
  target,
});

export const listRegisterSingletonPrivateEffect = compilePrivate(
  listFrameRegisterSingletonPrivateEffect,
  listRootIllegalPrivateEffect,
);

/**
 * @type {(
 *   target: import("../../atom.d.ts").Expression,
 *   key: import("estree-sentry").PrivateKeyName,
 *   value: import("../../atom.d.ts").Expression,
 * ) => import("./index.d.ts").DefinePrivateOperation}
 */
export const makeDefinePrivateOperation = (target, key, value) => ({
  target,
  key,
  value,
});

export const listDefinePrivateEffect = compilePrivate(
  listFrameDefinePrivateEffect,
  listRootIllegalPrivateEffect,
);
