export type BlockVariableKind = "let" | "const" | "class" | "import";

export type ClosureVariableKind = "var" | "function" | "callee";

export type VariableKind = BlockVariableKind | ClosureVariableKind;

export type Variable = Brand<string, "estree.Variable">;

export type Label = Brand<string, "estree.Label">;

export type Specifier = Brand<string, "estree.Specifier">;

export type Source = Brand<string, "estree.Source">;

export type Key = Brand<string, "estree.Key">;

export type PrivateKey = Brand<string, "estree.PrivateKey">;

export type ProtoProperty = estree.Property & {
  computed: false;
  method: false;
  shorthand: false;
  value: estree.Expression;
} & (
    | {
        key: estree.Identifier & { name: "__proto__" };
      }
    | { key: estree.Literal & { value: "__proto__" } }
  );

export type * from "../node_modules/@types/estree/index.d.ts";

export as namespace estree;
