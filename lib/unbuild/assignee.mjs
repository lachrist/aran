import { AranTypeError } from "../error.mjs";
import { duplicateKey } from "./key.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import { duplicateObject } from "./object.mjs";
import { zeroSequence, bindSequence } from "../util/index.mjs";

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./assignee").Assignee}
 */
export const makeVariableAssignee = (variable) => ({
  type: "variable",
  variable,
});

/**
 * @type {(
 *   object: import("./object").Object,
 *   key: import("./key").Key,
 * ) => import("./assignee").Assignee}
 */
export const makeMemberAssignee = (object, key) => ({
  type: "member",
  object,
  key,
});

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
 *   update: import("./assignee").Assignee,
 * ) => import("../util/sequence").Sequence<
 *   (
 *     | import("./prelude").BodyPrelude
 *     | import("./prelude").PrefixPrelude
 *   ),
 *   [
 *     import("./assignee").Assignee,
 *     import("./assignee").Assignee,
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
