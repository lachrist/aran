import { InternalLocalContext } from "../../../../lib/context";

export type Situ =
  | {
      kind: "module" | "script" | "eval";
      context: null;
    }
  | {
      kind: "eval";
      context: InternalLocalContext;
    };
