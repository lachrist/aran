export type ModuleSort = {
  kind: "module";
  mode: "strict";
  situ: "global";
};

export type ScriptSort = {
  kind: "script";
  mode: "strict" | "sloppy";
  situ: "global";
};

export type GlobalEvalSort = {
  kind: "eval";
  mode: "strict" | "sloppy";
  situ: "global";
};

export type ExternalLocalEvalSort = {
  kind: "eval";
  mode: "strict" | "sloppy";
  situ:
    | "program"
    | "function"
    | "method"
    | "constructor"
    | "derived-constructor";
};

export type InternalLocalEvalSort = {
  kind: "eval";
  mode: "strict" | "sloppy";
  situ: "local";
};

export type LocalEvalSort = InternalLocalEvalSort | ExternalLocalEvalSort;

export type EvalSort = GlobalEvalSort | LocalEvalSort;

export type Sort = ModuleSort | ScriptSort | EvalSort;

/////////////////
// Root | Node //
/////////////////

export type RootSort =
  | ScriptSort
  | ModuleSort
  | GlobalEvalSort
  | ExternalLocalEvalSort;

export type NodeSort = InternalLocalEvalSort;

////////////////////
// Global | Local //
////////////////////

export type GlobalSort = ModuleSort | ScriptSort | GlobalEvalSort;

export type LocalSort = ExternalLocalEvalSort | InternalLocalEvalSort;
