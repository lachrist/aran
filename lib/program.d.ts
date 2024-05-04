import { Context } from "./context";

export type EarlySyntaxError = {
  type: "EarlySyntaxError";
  message: string;
};

export type ModuleProgram<B> = {
  kind: "module";
  situ: "global";
  root: estree.ModuleProgram | EarlySyntaxError;
  base: B;
  context: null;
};

export type ScriptProgram<B> = {
  kind: "script";
  situ: "global";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: null;
};

export type GlobalEvalProgram<B> = {
  kind: "eval";
  situ: "global";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: null;
};

export type InternalLocalEvalProgram<B> = {
  kind: "eval";
  situ: "local.deep";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: Context;
};

export type ExternalLocalEvalProgram<B> = {
  kind: "eval";
  situ: "local.root";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: {
    mode: "strict" | "sloppy";
  };
};

export type LocalEvalProgram<B> =
  | InternalLocalEvalProgram<B>
  | ExternalLocalEvalProgram<B>;

export type EvalProgram<B> = GlobalEvalProgram<B> | LocalEvalProgram<B>;

export type Program<B> = ModuleProgram<B> | ScriptProgram<B> | EvalProgram<B>;

export type RootProgram<B> =
  | ModuleProgram<B>
  | ScriptProgram<B>
  | GlobalEvalProgram<B>
  | ExternalLocalEvalProgram<B>;

export type NodeProgram<B> = InternalLocalEvalProgram<B>;
