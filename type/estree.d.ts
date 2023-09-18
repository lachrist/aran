// Not doing the below because it turns the current file into a module
// And makes it not available as an ambient namespace.
// import type * as Estree from "../node_modules/@types/estree/index.d.ts";

declare namespace estree {
  type Variable = Brand<string, "estree.Variable">;
  type Label = Brand<string, "estree.Label">;
  type Specifier = Brand<string, "estree.Specifier">;
  type Source = Brand<string, "estree.Source">;
  type Super = import("../node_modules/@types/estree/index.d.ts").Super;
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
  type ProgramStatement = ModuleDeclaration | Statement | Directive;
}
