import { AranTypeError } from "../error.mjs";
import { duplicateKey } from "./key.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import { duplicateObject } from "./object.mjs";
import { zeroSequence, bindSequence } from "../util/index.mjs";

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./assignee.d.ts").Assignee}
 */
export const makeVariableAssignee = (variable) => ({
  type: "variable",
  variable,
});

/**
 * @type {(
 *   object: import("./object.d.ts").Object,
 *   key: import("./key.d.ts").Key,
 * ) => import("./assignee.d.ts").Assignee}
 */
export const makeMemberAssignee = (object, key) => ({
  type: "member",
  object,
  key,
});

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   update: import("./assignee.d.ts").Assignee,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   (
 *     | import("./prelude/index.d.ts").BodyPrelude
 *     | import("./prelude/index.d.ts").PrefixPrelude
 *   ),
 *   [
 *     import("./assignee.d.ts").Assignee,
 *     import("./assignee.d.ts").Assignee,
 *   ],
 * >}
 */
export const duplicateAssignee = (hash, meta, update) => {
  switch (update.type) {
    case "variable": {
      return zeroSequence([update, update]);
    }
    case "member": {
      return bindSequence(
        duplicateObject(hash, forkMeta((meta = nextMeta(meta))), update.object),
        ([object1, object2]) =>
          bindSequence(
            duplicateKey(hash, forkMeta((meta = nextMeta(meta))), update.key),
            ([key1, key2]) =>
              zeroSequence([
                { type: "member", object: object1, key: key1 },
                { type: "member", object: object2, key: key2 },
              ]),
          ),
      );
    }
    default: {
      throw new AranTypeError(update);
    }
  }
};
