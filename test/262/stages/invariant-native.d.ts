// @ts-nocheck

import { BlockKind, Variable } from "../../../type/advice";
import { Location } from "./util/aran";

export type Scope = {
  [k in Variable]: unknown;
} & {
  "invariant.restore": number;
  "invariant.location": Location;
  "invariant.kind":
    | BlockKind
    | "function"
    | "arrow"
    | "eval"
    | "module"
    | "script";
};
