import type {
  Directive,
  ModuleDeclaration,
  Statement,
  SwitchCase,
} from "../../estree";
import type { Path } from "../../path";

export type CompletionNode =
  | Statement
  | Directive
  | ModuleDeclaration
  | SwitchCase;

export type CompletionResult = {
  previous_maybe_last: boolean;
  paths: Path[];
};
