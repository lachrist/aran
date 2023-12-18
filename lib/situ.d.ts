export type ModuleSitu = {
  kind: "module";
  mode: "strict";
  scope: "global";
  ambient: "internal" | "external";
  closure: "program";
  root: "module";
};

export type ScriptSitu = {
  kind: "script";
  mode: "strict" | "sloppy";
  scope: "global";
  ambient: "internal" | "external";
  closure: "program";
  root: "script";
};

export type GlobalEvalSitu = {
  kind: "eval";
  mode: "strict" | "sloppy";
  scope: "global";
  ambient: "internal" | "external";
  closure: "program";
  root: "global-eval";
};

export type InternalLocalEvalSitu = {
  kind: "eval";
  mode: "strict";
  scope: "local";
  ambient: "internal";
  closure: "irrelevant";
  root: "module" | "script" | "global-eval";
};

export type ExternalLocalEvalSitu = {
  kind: "eval";
  mode: "strict" | "sloppy";
  scope: "local";
  ambient: "external";
  closure: "program" | "function" | "method" | "constructor";
  root: "module" | "script" | "global-eval";
};

export type LocalEvalSitu = ExternalLocalEvalSitu | InternalLocalEvalSitu;

export type EvalSitu = GlobalEvalSitu | LocalEvalSitu;

export type Situ = ModuleSitu | ScriptSitu | EvalSitu;

// Root //

export type RootSitu =
  | ModuleSitu
  | ScriptSitu
  | GlobalEvalSitu
  | ExternalLocalEvalSitu;

export type NodeSitu = InternalLocalEvalSitu;

// Mode //

export type StrictSitu = Situ & { mode: "strict" };

export type SloppySitu = Situ & { mode: "sloppy" };

// Ambient //

export type InternalSitu = Situ & { ambient: "internal" };

export type ExternalSitu = Situ & { ambient: "external" };

// Unviversal //

export type UniversalSitu = {
  kind: "module" | "script" | "eval";
  mode: "strict" | "sloppy";
  scope: "global" | "local";
  ambient: "internal" | "external";
  closure: "program" | "function" | "method" | "constructor" | "irrelevant";
  root: "module" | "script" | "global-eval" | "external-local-eval";
};

// Kind //

export type SituKind =
  | "module"
  | "script"
  | "global-eval"
  | "internal-local-eval"
  | "external-local-eval";
