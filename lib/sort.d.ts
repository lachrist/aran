import { Ancestry } from "./ancestery";

export type ModuleSort = {
  kind: "module";
  mode: "strict";
  situ: "global";
  ancestry: null;
};

export type ScriptSort = {
  kind: "script";
  mode: "strict" | "sloppy";
  situ: "global";
  ancestry: null;
};

export type GlobalEvalSort = {
  kind: "eval";
  mode: "strict" | "sloppy";
  situ: "global";
  ancestry: null;
};

export type ExternalLocalEvalSort = {
  kind: "eval";
  mode: "strict" | "sloppy";
  situ: "local";
  ancestry: Ancestry;
};

export type InternalLocalEvalSort = {
  kind: "eval";
  mode: "strict" | "sloppy";
  situ: "local";
  ancestry: null;
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
