import type { Object } from "./object.js";
import type { Key } from "./key.js";
import type { VariableName } from "estree-sentry";

export type Assignee =
  | {
      type: "variable";
      variable: VariableName;
    }
  | {
      type: "member";
      object: Object;
      key: Key;
    };
