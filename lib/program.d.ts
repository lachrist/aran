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

export type ModuleProgram<B> = {
  kind: "module";
  situ: "global";
  root: estree.ModuleProgram | EarlySyntaxError;
  base: B;
  context: GlobalContext;
};

export type ScriptProgram<B> = {
  kind: "script";
  situ: "global";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: GlobalContext;
};

export type GlobalEvalProgram<B> = {
  kind: "eval";
  situ: "global";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: GlobalContext;
};

export type DeepLocalEvalProgram<B> = {
  kind: "eval";
  situ: "local.deep";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: DeepLocalContext;
};

export type RootLocalEvalProgram<B> = {
  kind: "eval";
  situ: "local.root";
  root: estree.ScriptProgram | EarlySyntaxError;
  base: B;
  context: RootLocalContext;
};

export type LocalEvalProgram<B> =
  | DeepLocalEvalProgram<B>
  | RootLocalEvalProgram<B>;

export type EvalProgram<B> = GlobalEvalProgram<B> | LocalEvalProgram<B>;

export type Program<B> = ModuleProgram<B> | ScriptProgram<B> | EvalProgram<B>;

export type RootProgram<B> =
  | ModuleProgram<B>
  | ScriptProgram<B>
  | GlobalEvalProgram<B>
  | RootLocalEvalProgram<B>;

export type NodeProgram<B> = DeepLocalEvalProgram<B>;
