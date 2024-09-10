import type {
  Directive,
  ModuleDeclaration,
  Statement,
  SwitchCase,
} from "../../estree";
import type { Hash } from "../../hash";

export type CompletionNode =
  | Statement
  | Directive
  | ModuleDeclaration
  | SwitchCase;

export type CompletionResult = {
  previous_maybe_last: boolean;
  hashes: Hash[];
};
