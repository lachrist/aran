import type {
  AnonymousFunctionDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  FunctionDeclaration,
} from "estree-sentry";
import type { Hash } from "../../hash";
import type { Tree } from "../../util/tree";
import type { VariableName } from "estree-sentry";

export type BroadFunctionDeclaration<X> =
  | FunctionDeclaration<X>
  | AnonymousFunctionDeclaration<X>
  | (ExportDefaultDeclaration<X> & { declaration: FunctionDeclaration<X> })
  | (ExportNamedDeclaration<X> & { declaration: FunctionDeclaration<X> });

export type Zone = "live" | "dead" | "schrodinger";

type ScopeBinding =
  | "closure"
  | {
      variable: VariableName;
      baseline: Zone;
    };

export type Closure = "none" | "function-declaration" | "function-expression";

export type Scope = Tree<ScopeBinding>;

export type DeadzoneBinding = {
  hash: Hash;
  status: "live" | "dead" | "schrodinger";
};

export type RawDeadzone = Tree<DeadzoneBinding>;

export type Deadzone = {
  [key in Hash]?: Zone;
};

export type Foo = Tree<number[]>;
