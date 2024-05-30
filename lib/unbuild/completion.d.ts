import type { Expression, Program } from "estree";
import type { Path } from "../path.js";
import type { WritableCache } from "./cache.js";
import type { Site } from "./site.js";

export type VoidCompletion = {
  type: "void";
};

export type DirectCompletion = {
  type: "direct";
  site: Site<Expression>;
};

export type IndirectCompletion = {
  type: "indirect";
  cache: WritableCache;
  record: { [key in Path]: null | undefined };
  root: Program;
};

export type Completion = VoidCompletion | DirectCompletion | IndirectCompletion;

export type StatementCompletion = VoidCompletion | IndirectCompletion;

export type ProgramCompletion = DirectCompletion | IndirectCompletion;
