import type { Path } from "./path";
import type {
  ModuleProgram as EstreeModuleProgram,
  ScriptProgram as EstreeScriptProgram,
} from "./estree";
import type { Depth } from "./weave/depth";
import type { Reboot } from "./reboot";

export type GlobalContext = {};

export type RootLocalContext = {
  mode: "strict" | "sloppy";
};

export type DeepLocalContext = Reboot & {
  depth: Depth;
};

export type Context = GlobalContext | RootLocalContext | DeepLocalContext;

export type EarlySyntaxError = {
  type: "EarlySyntaxError";
  message: string;
};

export type Source =
  | {
      kind: "module";
      situ: "global";
      path: Path;
      root: EstreeModuleProgram | EarlySyntaxError;
      context: GlobalContext;
    }
  | {
      kind: "script";
      situ: "global";
      path: Path;
      root: EstreeScriptProgram | EarlySyntaxError;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "global";
      path: Path;
      root: EstreeScriptProgram | EarlySyntaxError;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "local.deep";
      path: Path;
      root: EstreeScriptProgram | EarlySyntaxError;
      context: DeepLocalContext;
    }
  | {
      kind: "eval";
      situ: "local.root";
      path: Path;
      root: EstreeScriptProgram | EarlySyntaxError;
      context: RootLocalContext;
    };

export type ModuleSource = Source & {
  kind: "module";
};

export type ScriptSource = Source & {
  kind: "script";
};

export type EvalSource = Source & {
  kind: "eval";
};

export type GlobalEvalSource = Source & {
  kind: "eval";
  situ: "global";
};

export type DeepLocalEvalSource = Source & {
  kind: "eval";
  situ: "local.deep";
};

export type RootLocalEvalSource = Source & {
  kind: "eval";
  situ: "local.root";
};

export type LocalEvalSource = Source & {
  kind: "eval";
  situ: "local.deep" | "local.root";
};

export type RootSource = Source & {
  situ: "global" | "local.root";
};

export type DeepSource = Source & {
  situ: "local.deep";
};
