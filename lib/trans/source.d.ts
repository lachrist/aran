import type { ModuleProgram, ScriptProgram } from "estree-sentry";
import type { HashProp } from "./hash.d.ts";
import type { Meta } from "./meta.d.ts";
import type { PackScope } from "./scope/index.d.ts";

export type GlobalSitu = {
  type: "global";
};

export type RootLocalSitu = {
  type: "local";
  mode: "strict" | "sloppy";
};

export type DeepLocalSitu = {
  type: "aran";
  meta: Meta;
  scope: PackScope;
};

export type Situ = GlobalSitu | RootLocalSitu | DeepLocalSitu;

export type ModuleSource = {
  kind: "module";
  situ: GlobalSitu;
  root: ModuleProgram<HashProp>;
};

export type ScriptSource = {
  kind: "script";
  situ: GlobalSitu;
  root: ScriptProgram<HashProp>;
};

export type EvalSource = {
  kind: "eval";
  situ: Situ;
  root: ScriptProgram<HashProp>;
};

export type Source = ModuleSource | ScriptSource | EvalSource;

export type GlobalEvalSource = EvalSource & {
  situ: { type: "global" };
};

export type DeepLocalEvalSource = EvalSource & {
  situ: { type: "local" };
};

export type RootLocalEvalSource = EvalSource & {
  situ: { type: "aran" };
};

export type LocalEvalSource = EvalSource & {
  situ: { type: "local" | "aran" };
};

export type RootSource =
  | ModuleSource
  | ScriptSource
  | GlobalEvalSource
  | RootLocalEvalSource;

export type DeepSource = DeepLocalEvalSource;
