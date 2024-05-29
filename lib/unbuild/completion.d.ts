import { Path } from "../path.js";
import type { WritableCache } from "./cache.js";
import { Site } from "./site.js";

export type CompletionNode =
  | estree.Statement
  | estree.Directive
  | estree.ModuleDeclaration
  | estree.CatchClause
  | estree.SwitchCase;

export type CompletionResult = {
  last: boolean;
  paths: Path[];
};

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
  record: { [key in Path]: null | undefined };
  root: estree.Program;
};

export type Completion = VoidCompletion | DirectCompletion | IndirectCompletion;

export type StatementCompletion = VoidCompletion | IndirectCompletion;

export type ProgramCompletion = DirectCompletion | IndirectCompletion;
