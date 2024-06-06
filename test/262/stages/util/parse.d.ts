import {
  DeepLocalContext,
  GlobalContext,
  RootLocalContext,
} from "../../../../lib/source";

export type RawProgram<B> =
  | {
      kind: "module";
      situ: "global";
      base: B;
      code: string;
      context: GlobalContext;
    }
  | {
      kind: "script";
      situ: "global";
      base: B;
      code: string;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "global";
      base: B;
      code: string;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "local.deep";
      base: B;
      code: string;
      context: DeepLocalContext;
    }
  | {
      kind: "eval";
      situ: "local.root";
      base: B;
      code: string;
      context: RootLocalContext;
    };
