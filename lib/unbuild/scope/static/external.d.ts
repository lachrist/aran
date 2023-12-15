import { WritableCache } from "../../cache";

export type ExternalBinding =
  | {
      kind: "var";
      deadzone: null;
    }
  | {
      kind: "let";
      deadzone: WritableCache;
    }
  | {
      kind: "const";
      deadzone: WritableCache;
    };
