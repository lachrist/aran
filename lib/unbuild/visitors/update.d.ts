import type { Object } from "../object.d.ts";
import type { Key } from "../key.d.ts";

export type Update =
  | {
      type: "variable";
      variable: estree.Variable;
    }
  | {
      type: "member";
      object: Object;
      key: Key;
    };
