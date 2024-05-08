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

export type Program<B> =
  | {
      kind: "module";
      situ: "global";
      root: estree.ModuleProgram | EarlySyntaxError;
      base: B;
      context: GlobalContext;
    }
  | {
      kind: "script";
      situ: "global";
      root: estree.ScriptProgram | EarlySyntaxError;
      base: B;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "global";
      root: estree.ScriptProgram | EarlySyntaxError;
      base: B;
      context: GlobalContext;
    }
  | {
      kind: "eval";
      situ: "local.deep";
      root: estree.ScriptProgram | EarlySyntaxError;
      base: B;
      context: DeepLocalContext;
    }
  | {
      kind: "eval";
      situ: "local.root";
      root: estree.ScriptProgram | EarlySyntaxError;
      base: B;
      context: RootLocalContext;
    };

export type ModuleProgram<B> = Program<B> & {
  kind: "module";
};

export type ScriptProgram<B> = Program<B> & {
  kind: "script";
};

export type EvalProgram<B> = Program<B> & {
  kind: "eval";
};

export type GlobalEvalProgram<B> = Program<B> & {
  kind: "eval";
  situ: "global";
};

export type DeepLocalEvalProgram<B> = Program<B> & {
  kind: "eval";
  situ: "local.deep";
};

export type RootLocalEvalProgram<B> = Program<B> & {
  kind: "eval";
  situ: "local.root";
};

export type LocalEvalProgram<B> = Program<B> & {
  kind: "eval";
  situ: "local.deep" | "local.root";
};

export type RootProgram<B> = Program<B> & {
  situ: "global" | "local.root";
};

export type DeepProgram<B> = Program<B> & {
  situ: "local.deep";
};
