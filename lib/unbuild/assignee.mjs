import { AranTypeError } from "../error.mjs";
import { duplicateKey } from "./key.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import { duplicateObject } from "./object.mjs";
import { zeroSequence, bindSequence } from "../sequence.mjs";

/**
 * @type {(
 *   variable: estree.Variable,
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
 *   site: import("./site").LeafSite,
 *   update: import("./assignee").Assignee,
 * ) => import("../sequence").Sequence<
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
export const duplicateAssignee = ({ path, meta }, update) => {
  switch (update.type) {
    case "variable": {
      return zeroSequence([update, update]);
    }
    case "member": {
      return bindSequence(
        duplicateObject(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          update.object,
        ),
        ([object1, object2]) =>
          bindSequence(
            duplicateKey(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              update.key,
            ),
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
