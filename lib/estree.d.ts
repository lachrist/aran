import type * as estree from "../node_modules/@types/estree/index.d.ts";

export type VariableKind = "var" | "function" | "let" | "const" | "class";

export type Variable = Brand<string, "estree.Variable">;

export type ModuleProgram = estree.Program & {
  sourceType: "module";
};

export type ScriptProgram = estree.Program & {
  sourceType: "script";
};

export type Label = Brand<string, "estree.Label">;

export type Specifier = Brand<string, "estree.Specifier">;

export type Source = Brand<string, "estree.Source">;

export type Key = Brand<string, "estree.Key">;

export type PrivateKey = Brand<string, "estree.PrivateKey">;

export type InitProperty = estree.Property & {
  kind: "init";
  method: false;
};

export type ProtoProperty = estree.Property & {
  kind: "init";
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
