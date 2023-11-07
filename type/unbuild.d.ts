import type { Context } from "../lib/unbuild/context.d.ts";

export type DeadzoneBaseVariable = Brand<
  string,
  "unbuild.DeadzoneBaseVariable"
>;

export type OriginalBaseVariable = Brand<
  string,
  "unbuild.OriginalBaseVariable"
>;

export type ConstantMetaVariable = Brand<
  string,
  "unbuild.ConstantMetaVariable"
>;

export type WritableMetaVariable = Brand<
  string,
  "unbuild.WritableMetaVariable"
>;

export type MetaVariable = ConstantMetaVariable | WritableMetaVariable;

export type BaseVariable = DeadzoneBaseVariable | OriginalBaseVariable;

export type Variable = BaseVariable | MetaVariable;

export type Label = Brand<string, "unbuild.Label">;

export type Path = Brand<string, "unbuild.Path">;

export type Meta = Brand<bigint, "unbuild.Meta">;

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
    context: (Context & { meta: string }) | null;
    logs: Log[];
  };
};

export as namespace unbuild;
