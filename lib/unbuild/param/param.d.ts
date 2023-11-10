import { Cache } from "../cache.mjs";

export type Param = {
  program: "eval" | "module" | "script";
  situ: "global" | "local";
  catch: boolean;
  privates: { [k in estree.PrivateKey]: Cache };
  arrow: "arrow" | "eval" | "none";
  function:
    | { type: "none" }
    | {
        type: "function";
      }
    | {
        type: "method";
        proto: Cache;
      }
    | {
        type: "constructor";
        self: Cache;
        super: Cache | null;
        field: Cache | null;
      };
};
