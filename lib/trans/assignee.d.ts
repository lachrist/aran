import type { Object } from "./object.d.ts";
import type { Key } from "./key.d.ts";
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
