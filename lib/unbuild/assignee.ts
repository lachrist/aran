import type { Object } from "./object.js";
import type { Key } from "./key.js";

export type Assignee =
  | {
      type: "variable";
      variable: estree.Variable;
    }
  | {
      type: "member";
      object: Object;
      key: Key;
    };
