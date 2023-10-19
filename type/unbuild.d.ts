import type { Context } from "../lib/unbuild/context.d.ts";

export type Variable = Brand<string, "unbuild.Variable">;

export type Label = Brand<string, "unbuild.Label">;

export type Path = Brand<string, "unbuild.Path">;

export type Log =
  | {
      name: "SyntaxError";
      message: string;
    }
  | {
      name: "EnclaveLimitation";
      message: string;
    }
  | {
      name: "BlockFunctionDeclaration";
      message: string;
    };

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  GlobalVariable: estree.Variable;
  Tag: {
    path: Path;
    initialization: Variable | null;
    context: Context | null;
    logs: Log[];
  };
};

export as namespace unbuild;
