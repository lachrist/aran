import type { Object } from "./object.js";
import type { Key } from "./key.js";
import { Variable } from "../estree.js";

export type Assignee =
  | {
      type: "variable";
      variable: Variable;
    }
  | {
      type: "member";
      object: Object;
      key: Key;
    };
