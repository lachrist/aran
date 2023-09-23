// Not doing the below because it turns the current file into a module
// And makes it not available as an ambient namespace.
// import type * as Estree from "../node_modules/@types/estree/index.d.ts";

declare namespace estree {
  type BlockVariableKind = "let" | "const" | "class";
  type ClosureVariableKind = "var" | "function";
  type VariableKind = BlockVariableKind | ClosureVariableKind;
  type Variable = Brand<string, "estree.Variable">;
  type Label = Brand<string, "estree.Label">;
  type Specifier = Brand<string, "estree.Specifier">;
  type Source = Brand<string, "estree.Source">;
  type Super = import("../node_modules/@types/estree/index.d.ts").Super;
  type TemplateElement =
    import("../node_modules/@types/estree/index.d.ts").TemplateElement;
  type SpreadElement =
    import("../node_modules/@types/estree/index.d.ts").SpreadElement;
  type RegExpLiteral =
    import("../node_modules/@types/estree/index.d.ts").RegExpLiteral;
  type Identifier =
    import("../node_modules/@types/estree/index.d.ts").Identifier;
  type PrivateIdentifier =
    import("../node_modules/@types/estree/index.d.ts").PrivateIdentifier;
  type SwitchCase =
    import("../node_modules/@types/estree/index.d.ts").SwitchCase;
  type UnaryOperator =
    import("../node_modules/@types/estree/index.d.ts").UnaryOperator;
  type BinaryOperator =
    import("../node_modules/@types/estree/index.d.ts").BinaryOperator;
  type ExportSpecifier =
    import("../node_modules/@types/estree/index.d.ts").ExportSpecifier;
  type ImportSpecifier =
    import("../node_modules/@types/estree/index.d.ts").ImportSpecifier;
  type ImportDefaultSpecifier =
    import("../node_modules/@types/estree/index.d.ts").ImportDefaultSpecifier;
  type ImportNamespaceSpecifier =
    import("../node_modules/@types/estree/index.d.ts").ImportNamespaceSpecifier;
  type AssignmentProperty =
    import("../node_modules/@types/estree/index.d.ts").AssignmentProperty;
  type RestElement =
    import("../node_modules/@types/estree/index.d.ts").RestElement;
  type UnionImportSpecifier =
    | import("../node_modules/@types/estree/index.d.ts").ImportSpecifier
    | import("../node_modules/@types/estree/index.d.ts").ImportDefaultSpecifier
    | import("../node_modules/@types/estree/index.d.ts").ImportNamespaceSpecifier;
  type Function = import("../node_modules/@types/estree/index.d.ts").Function;
  type BigIntLiteral =
    import("../node_modules/@types/estree/index.d.ts").BigIntLiteral;
  type SimpleLiteral =
    import("../node_modules/@types/estree/index.d.ts").SimpleLiteral;
  type SourceLocation =
    import("../node_modules/@types/estree/index.d.ts").SourceLocation;
  type VariableDeclaration =
    import("../node_modules/@types/estree/index.d.ts").VariableDeclaration;
  type FunctionDeclaration =
    import("../node_modules/@types/estree/index.d.ts").FunctionDeclaration;
  type FunctionExpression =
    import("../node_modules/@types/estree/index.d.ts").FunctionExpression;
  type ArrowFunctionExpression =
    import("../node_modules/@types/estree/index.d.ts").ArrowFunctionExpression;
  type ClassDeclaration =
    import("../node_modules/@types/estree/index.d.ts").ClassDeclaration;
  type Statement = import("../node_modules/@types/estree/index.d.ts").Statement;
  type Expression =
    import("../node_modules/@types/estree/index.d.ts").Expression;
  type Program = import("../node_modules/@types/estree/index.d.ts").Program;
  type Node = import("../node_modules/@types/estree/index.d.ts").Node;
  type Literal = import("../node_modules/@types/estree/index.d.ts").Literal;
  type Pattern = import("../node_modules/@types/estree/index.d.ts").Pattern;
  type VariableDeclarator =
    import("../node_modules/@types/estree/index.d.ts").VariableDeclarator;
  type ModuleDeclaration =
    import("../node_modules/@types/estree/index.d.ts").ModuleDeclaration;
  type BlockStatement =
    import("../node_modules/@types/estree/index.d.ts").BlockStatement;
  type Directive = import("../node_modules/@types/estree/index.d.ts").Directive;
  type Property = import("../node_modules/@types/estree/index.d.ts").Property;
  type CatchClause =
    import("../node_modules/@types/estree/index.d.ts").CatchClause;
  type ProgramStatement = ModuleDeclaration | Statement | Directive;
  type ProtoProperty = Property & {
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
  type InitProperty = Property & { kind: "init" };
}
