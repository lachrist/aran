import {
  CatchClause,
  Directive,
  ModuleDeclaration,
  Statement,
  SwitchCase,
} from "estree";
import { Path } from "../../path";

export type CompletionNode =
  | Statement
  | Directive
  | ModuleDeclaration
  | CatchClause
  | SwitchCase;

export type CompletionResult = {
  last: boolean;
  paths: Path[];
};
