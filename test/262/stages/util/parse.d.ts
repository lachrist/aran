import {
  Path,
  DeepLocalContext,
  GlobalContext,
  RootLocalContext,
} from "../../../../lib";

export type RawProgram =
  | {
      kind: "module";
      situ: "global";
      path: Path;
      code: string;
      context: GlobalContext;
    }
  | {
      kind: "script";
      situ: "global";
      path: Path;
      code: string;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "global";
      path: Path;
      code: string;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "local.deep";
      path: Path;
      code: string;
      context: DeepLocalContext;
    }
  | {
      kind: "eval";
      situ: "local.root";
      path: Path;
      code: string;
      context: RootLocalContext;
    };
