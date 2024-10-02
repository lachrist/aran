import type { ModuleDeclaration, Statement, SwitchCase } from "estree-sentry";
import type { Hash } from "../../hash";
import type { Tree } from "../../util/tree";

export type CompletionNode<X> =
  | Statement<X>
  | ModuleDeclaration<X>
  | SwitchCase<X>;

export type CompletionResult = {
  previous_maybe_last: boolean;
  hashes: Tree<Hash>;
};

export type Completion = {
  [key in Hash]?: null;
};
