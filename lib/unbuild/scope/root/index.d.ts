import { ExternalLocalEvalSort, GlobalSort, RootSort } from "../../../sort";
import { WritableCache } from "../../cache";

export type ReifyBinding = {
  type: "reify";
  record: "aran.global" | "aran.record";
  writable: boolean;
};

export type AlienBinding = {
  type: "alien";
  deadzone: null | WritableCache;
  writable: boolean;
};

export type Declare = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "var" | "let" | "const";
  variable: estree.Variable;
};

export type ReifyRootFrame = {
  type: "root-reify";
  sort: GlobalSort;
  record: {
    [k in estree.Variable]?: ReifyBinding;
  };
};

export type AlienRootFrame = {
  type: "root-alien";
  sort: RootSort;
  record: {
    [k in estree.Variable]?: AlienBinding;
  };
};

export type RootFrame = ReifyRootFrame | AlienRootFrame;
