import { Path } from "./path";
import { PackMeta } from "./unbuild/meta";
import { PackScope } from "./unbuild/scope";

export type GlobalContext = {};

export type RootLocalContext = {
  mode: "strict" | "sloppy";
};

export type DeepLocalContext = {
  meta: PackMeta;
  scope: PackScope;
};

export type Context = GlobalContext | RootLocalContext | DeepLocalContext;

export type EarlySyntaxError = {
  type: "EarlySyntaxError";
  message: string;
};

export type Program =
  | {
      kind: "module";
      situ: "global";
      path: Path;
      root: estree.ModuleProgram | EarlySyntaxError;
      context: GlobalContext;
    }
  | {
      kind: "script";
      situ: "global";
      path: Path;
      root: estree.ScriptProgram | EarlySyntaxError;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "global";
      path: Path;
      root: estree.ScriptProgram | EarlySyntaxError;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "local.deep";
      path: Path;
      root: estree.ScriptProgram | EarlySyntaxError;
      context: DeepLocalContext;
    }
  | {
      kind: "eval";
      situ: "local.root";
      path: Path;
      root: estree.ScriptProgram | EarlySyntaxError;
      context: RootLocalContext;
    };

export type ModuleProgram = Program & {
  kind: "module";
};

export type ScriptProgram = Program & {
  kind: "script";
};

export type EvalProgram = Program & {
  kind: "eval";
};

export type GlobalEvalProgram = Program & {
  kind: "eval";
  situ: "global";
};

export type DeepLocalEvalProgram = Program & {
  kind: "eval";
  situ: "local.deep";
};

export type RootLocalEvalProgram = Program & {
  kind: "eval";
  situ: "local.root";
};

export type LocalEvalProgram = Program & {
  kind: "eval";
  situ: "local.deep" | "local.root";
};

export type RootProgram = Program & {
  situ: "global" | "local.root";
};

export type DeepProgram = Program & {
  situ: "local.deep";
};
