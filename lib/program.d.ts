import {
  Context,
  ExternalLocalContext,
  GlobalContext,
  InternalLocalContext,
} from "./context";

export type ModuleProgram<B> = {
  kind: "module";
  root: estree.Program;
  base: B;
  context: GlobalContext;
};

export type ScriptProgram<B> = {
  kind: "script";
  root: estree.Program;
  base: B;
  context: GlobalContext;
};

export type GlobalEvalProgram<B> = {
  kind: "eval";
  root: estree.Program;
  base: B;
  context: GlobalContext;
};

export type InternalLocalEvalProgram<B> = {
  kind: "eval";
  root: estree.Program;
  base: B;
  context: InternalLocalContext;
};

export type ExternalLocalEvalProgram<B> = {
  kind: "eval";
  root: estree.Program;
  base: B;
  context: ExternalLocalContext;
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
