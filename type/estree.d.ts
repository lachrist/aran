import type * as Estree from "../node_modules/@types/estree/index.d.ts";

export type * from "../node_modules/@types/estree/index.d.ts";

export type BlockVariableKind = "let" | "const" | "class";

export type ClosureVariableKind = "var" | "function";

export type VariableKind = BlockVariableKind | ClosureVariableKind;

export type Variable = Brand<string, "estree.Variable">;

export type Label = Brand<string, "estree.Label">;

export type Specifier = Brand<string, "estree.Specifier">;

export type Source = Brand<string, "estree.Source">;

export type Key = Brand<string, "estree.Key">;

export type PrivateKey = Brand<string, "estree.PrivateKey">;

export type UnionImportSpecifier =
  | Estree.ImportSpecifier
  | Estree.ImportDefaultSpecifier
  | Estree.ImportNamespaceSpecifier;

export type ProgramStatement =
  | Estree.ModuleDeclaration
  | Estree.Statement
  | Estree.Directive;

export type ProtoProperty = Estree.Property & {
  kind: "init";
  method: false;
  computed: false;
  key:
    | {
        type: "Identifier";
        name: "__proto__";
      }
    | {
        type: "Literal";
        value: "__proto__";
      };
};

export type InitProperty = Estree.Property & { kind: "init" };

export as namespace estree;
