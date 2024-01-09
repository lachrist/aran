import { PackMeta } from "./unbuild/meta";
import { Scope } from "./unbuild/scope";

export type ScriptContext = {
  source: "script";
  mode: "strict" | "sloppy";
  scope: "reify" | "alien";
};

export type ModuleContext = {
  source: "module";
  mode: "strict" | "sloppy";
  scope: "reify" | "alien";
};

export type GlobalEvalContext = {
  source: "global-eval";
  mode: "strict" | "sloppy";
  scope: "reify" | "alien";
};

export type ExternalLocalEvalParameter =
  | "new.target"
  | "import.meta"
  | "super.call"
  | "super.get"
  | "super.set";

export type ExternalLocalEvalContext = {
  source: "local-eval";
  mode: "strict" | "sloppy";
  scope: ExternalLocalEvalParameter[];
};

export type InternalLocalEvalContext = {
  source: "aran-eval";
  mode: "strict" | "sloppy";
  meta: PackMeta;
  scope: Scope;
};

export type LocalEvalContext =
  | ExternalLocalEvalContext
  | InternalLocalEvalContext;

export type EvalContext = GlobalEvalContext | LocalEvalContext;

type Context = ScriptContext | ModuleContext | EvalContext;

// Global | Local //

export type LocalContext = InternalLocalEvalContext | ExternalLocalEvalContext;

export type GlobalContext = ScriptContext | ModuleContext | GlobalEvalContext;

// Root | Node //

export type RootContext = ExternalLocalEvalContext | GlobalContext;

export type NodeContext = InternalLocalEvalContext;
