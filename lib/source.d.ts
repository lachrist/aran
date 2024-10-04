import type { Depth } from "./weave/depth";
import type { Reboot } from "./reboot";
import type { ModuleProgram, ScriptProgram } from "estree-sentry";
import type { HashProp } from "./hash";

export type GlobalSitu = {
  type: "global";
};

export type RootLocalSitu = {
  type: "local";
  mode: "strict" | "sloppy";
};

export type DeepLocalSitu = Reboot & {
  type: "aran";
  depth: Depth;
};

export type Situ = GlobalSitu | RootLocalSitu | DeepLocalSitu;

export type ModuleSource = {
  kind: "module";
  situ: GlobalSitu;
  root: ModuleProgram<HashProp>;
};

export type ScriptSource = {
  kind: "script";
  situ: Situ;
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
