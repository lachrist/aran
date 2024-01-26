import type { WritableCache } from "./cache.js";
import { Site } from "./site.js";

export type VoidCompletion = {
  type: "void";
};

export type DirectCompletion = {
  type: "direct";
  site: Site<estree.Expression>;
};

export type IndirectCompletion = {
  type: "indirect";
  cache: WritableCache;
  root: estree.Program;
};

export type Completion = VoidCompletion | DirectCompletion | IndirectCompletion;

export type StatementCompletion = VoidCompletion | IndirectCompletion;

export type ProgramCompletion = DirectCompletion | IndirectCompletion;
