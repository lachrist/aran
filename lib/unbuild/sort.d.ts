export type Sort = ScriptSort | ModuleSort | EvalSort;

export type RootSort = "script" | "module" | "eval.global" | "eval.local.root";

export type NodeSort = "eval.local.deep";

export type ScriptSort = "script";

export type ModuleSort = "module";

export type EvalSort = "eval.global" | "eval.local.deep" | "eval.local.root";

export type GlobalSort = "script" | "module" | "eval.global";

export type LocalSort = "eval.local.deep" | "eval.local.root";
