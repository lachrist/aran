import type { Brand } from "./util";

export type SourceLocation = {
  source?: string | null | undefined;
  start: Position;
  end: Position;
};

export type Position = {
  line: number;
  column: number;
};

/////////////////
// Enumeration //
/////////////////

export type UnaryOperator =
  | "-"
  | "+"
  | "!"
  | "~"
  | "typeof"
  | "void"
  | "delete";

export type BinaryOperator =
  | "=="
  | "!="
  | "==="
  | "!=="
  | "<"
  | "<="
  | ">"
  | ">="
  | "<<"
  | ">>"
  | ">>>"
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "**"
  | "|"
  | "^"
  | "&"
  | "in"
  | "instanceof";

export type LogicalOperator = "||" | "&&" | "??";

export type AssignmentOperator =
  | "="
  | "+="
  | "-="
  | "*="
  | "/="
  | "%="
  | "**="
  | "<<="
  | ">>="
  | ">>>="
  | "|="
  | "^="
  | "&="
  | "||="
  | "&&="
  | "??=";

export type UpdateOperator = "++" | "--";

///////////
// Brand //
///////////

export type PublicKey = Brand<string, "estree.PublicKey">;

export type PublicKeyIdentifier = {
  type: "Identifier";
  loc?: SourceLocation | null | undefined;
  name: PublicKey;
};

export type PublicKeyLiteral =
  | {
      type: "Literal";
      loc?: SourceLocation | null | undefined;
      value: PublicKey | number | null | boolean;
      bigint?: null | undefined;
    }
  | {
      type: "Literal";
      loc?: SourceLocation | null | undefined;
      value: bigint;
      bigint: string;
    };

export type PrivateKey = Brand<string, "estree.PrivateKey">;

export type PrivateKeyIdentifier = {
  type: "PrivateIdentifier";
  loc?: SourceLocation | null | undefined;
  name: PrivateKey;
};

export type Variable = Brand<string, "estree.Variable">;

export type VariableIdentifier = {
  type: "Identifier";
  loc?: SourceLocation | null | undefined;
  name: Variable;
};

export type Label = Brand<string, "estree.Label">;

export type LabelIdentifier = {
  type: "Identifier";
  loc?: SourceLocation | null | undefined;
  name: Label;
};

export type Specifier = Brand<string, "estree.Specifier">;

export type SpecifierIdentifier = {
  type: "Identifier";
  loc?: SourceLocation | null | undefined;
  name: Specifier;
};

export type SpecifierLiteral = {
  type: "Literal";
  loc?: SourceLocation | null | undefined;
  value: Specifier;
};

export type Source = Brand<string, "estree.Source">;

export type SourceLiteral = {
  type: "Literal";
  loc?: SourceLocation | null | undefined;
  value: Source;
};

export type Meta = Brand<string, "estree.Meta">;

export type MetaIdentifier = {
  type: "Identifier";
  loc?: SourceLocation | null | undefined;
  name: Meta;
};

export type ProtoIdentifier = {
  type: "Identifier";
  loc?: SourceLocation | null | undefined;
  name: "__proto__";
};

export type ConstructorIdentifier = {
  type: "Identifier";
  loc?: SourceLocation | null | undefined;
  name: "constructor";
};

/////////////
// Program //
/////////////

export type Program = {
  type: "Program";
  loc?: SourceLocation | null | undefined;
  sourceType: "script" | "module";
  body: Array<Directive | Statement | ModuleDeclaration>;
};

export type ModuleProgram = Program & {
  sourceType: "module";
};

export type ScriptProgram = Program & {
  sourceType: "script";
};

///////////////
// Directive //
///////////////

export type Directive = {
  type: "ExpressionStatement";
  loc?: SourceLocation | null | undefined;
  expression: Literal;
  directive: string;
};

///////////////
// Statement //
///////////////

export type Statement =
  | ExpressionStatement
  | BlockStatement
  | EmptyStatement
  | DebuggerStatement
  | WithStatement
  | ReturnStatement
  | LabeledStatement
  | BreakStatement
  | ContinueStatement
  | IfStatement
  | SwitchStatement
  | ThrowStatement
  | TryStatement
  | WhileStatement
  | DoWhileStatement
  | ForStatement
  | ForInStatement
  | ForOfStatement
  | VariableDeclaration
  | FunctionDeclaration
  | ClassDeclaration;

export type EmptyStatement = {
  type: "EmptyStatement";
  loc?: SourceLocation | null | undefined;
};

export type BlockStatement = {
  type: "BlockStatement";
  loc?: SourceLocation | null | undefined;
  body: Statement[];
};

export type ExpressionStatement = {
  type: "ExpressionStatement";
  loc?: SourceLocation | null | undefined;
  expression: Expression;
};

export type IfStatement = {
  type: "IfStatement";
  loc?: SourceLocation | null | undefined;
  test: Expression;
  consequent: Statement;
  alternate?: Statement | null | undefined;
};

export type LabeledStatement = {
  type: "LabeledStatement";
  loc?: SourceLocation | null | undefined;
  label: LabelIdentifier;
  body: Statement;
};

export type BreakStatement = {
  type: "BreakStatement";
  loc?: SourceLocation | null | undefined;
  label?: LabelIdentifier | null | undefined;
};

export type ContinueStatement = {
  type: "ContinueStatement";
  loc?: SourceLocation | null | undefined;
  label?: LabelIdentifier | null | undefined;
};

export type WithStatement = {
  type: "WithStatement";
  loc?: SourceLocation | null | undefined;
  object: Expression;
  body: Statement;
};

export type SwitchStatement = {
  type: "SwitchStatement";
  loc?: SourceLocation | null | undefined;
  discriminant: Expression;
  cases: SwitchCase[];
};

export type ReturnStatement = {
  type: "ReturnStatement";
  loc?: SourceLocation | null | undefined;
  argument?: Expression | null | undefined;
};

export type ThrowStatement = {
  type: "ThrowStatement";
  loc?: SourceLocation | null | undefined;
  argument: Expression;
};

export type TryStatement = {
  type: "TryStatement";
  loc?: SourceLocation | null | undefined;
  block: BlockStatement;
  handler?: CatchClause | null | undefined;
  finalizer?: BlockStatement | null | undefined;
};

export type WhileStatement = {
  type: "WhileStatement";
  loc?: SourceLocation | null | undefined;
  test: Expression;
  body: Statement;
};

export type DoWhileStatement = {
  type: "DoWhileStatement";
  loc?: SourceLocation | null | undefined;
  body: Statement;
  test: Expression;
};

export type ForStatement = {
  type: "ForStatement";
  loc?: SourceLocation | null | undefined;
  init?: VariableDeclaration | Expression | null | undefined;
  test?: Expression | null | undefined;
  update?: Expression | null | undefined;
  body: Statement;
};

export type ForInStatement = {
  type: "ForInStatement";
  loc?: SourceLocation | null | undefined;
  left: VariableDeclaration | Pattern;
  right: Expression;
  body: Statement;
};

export type ForOfStatement = {
  type: "ForOfStatement";
  loc?: SourceLocation | null | undefined;
  await?: boolean | null | undefined;
  left: VariableDeclaration | Pattern;
  right: Expression;
  body: Statement;
};

export type DebuggerStatement = {
  type: "DebuggerStatement";
  loc?: SourceLocation | null | undefined;
};

export type VariableDeclaration = {
  type: "VariableDeclaration";
  loc?: SourceLocation | null | undefined;
  declarations: VariableDeclarator[];
  kind: "var" | "let" | "const";
};

export type VariableDeclarator = {
  type: "VariableDeclarator";
  loc?: SourceLocation | null | undefined;
  id: Pattern;
  init?: Expression | null | undefined;
};

//////////
// Node //
//////////

export type Node =
  | Program
  | Statement
  | Expression
  | VariableIdentifier
  | PublicKeyIdentifier
  | PrivateKeyIdentifier
  | SpecifierIdentifier
  | LabelIdentifier
  | MetaIdentifier
  | PublicKeyLiteral
  | SpecifierLiteral
  | SourceLiteral
  | SwitchCase
  | CatchClause
  | Directive
  | ModuleDeclaration
  | VariableDeclarator
  | Pattern
  | ObjectProperty
  | PatternProperty
  | SpreadElement
  | Super
  | TemplateElement
  | PropertyDefinition
  | MethodDefinition
  | StaticBlock
  | ImportSpecifier
  | ImportDefaultSpecifier
  | ImportNamespaceSpecifier
  | AggregatExportSpecifier
  | ExportSpecifier
  | AnonymousDefaultExportedClassDeclaration
  | AnonymousDefaultExportedFunctionDeclaration;

////////////////
// Expression //
////////////////

export type Expression =
  | ArrayExpression
  | ArrowFunctionExpression
  | AssignmentExpression
  | AwaitExpression
  | BinaryExpression
  | CallExpression
  | ChainExpression
  | ClassExpression
  | ConditionalExpression
  | FunctionExpression
  | VariableIdentifier
  | ImportExpression
  | Literal
  | LogicalExpression
  | MemberExpression
  | MetaProperty
  | NewExpression
  | ObjectExpression
  | SequenceExpression
  | TaggedTemplateExpression
  | TemplateLiteral
  | ThisExpression
  | UnaryExpression
  | UpdateExpression
  | YieldExpression;

export type ChainElement = CallExpression | MemberExpression;

export type ChainExpression = {
  type: "ChainExpression";
  loc?: SourceLocation | null | undefined;
  expression: ChainElement;
};

export type ThisExpression = {
  type: "ThisExpression";
  loc?: SourceLocation | null | undefined;
};

export type ArrayExpression = {
  type: "ArrayExpression";
  loc?: SourceLocation | null | undefined;
  elements: Array<Expression | SpreadElement | null>;
};

export type ObjectExpression = {
  type: "ObjectExpression";
  loc?: SourceLocation | null | undefined;
  properties: Array<ObjectProperty | SpreadElement>;
};

export type ObjectProperty =
  | {
      type: "Property";
      loc?: SourceLocation | null | undefined;
      key: Expression;
      value: Expression;
      kind: "init" | "get" | "set";
      method: boolean;
      shorthand: boolean;
      computed: true;
    }
  | {
      type: "Property";
      loc?: SourceLocation | null | undefined;
      key: PublicKeyLiteral | PublicKeyIdentifier;
      value: Expression;
      kind: "init" | "get" | "set";
      method: boolean;
      shorthand: boolean;
      computed: false;
    };

export type InitObjectProperty = ObjectProperty & {
  kind: "init";
  method: false;
};

export type ProtoObjectProperty = InitObjectProperty & {
  computed: false;
} & (
    | {
        key: PublicKeyIdentifier & { name: "__proto__" };
      }
    | { key: PublicKeyLiteral & { value: "__proto__" } }
  );

export type PatternProperty =
  | {
      type: "Property";
      loc?: SourceLocation | null | undefined;
      key: Expression;
      value: Pattern;
      kind: "init";
      method: false;
      shorthand: boolean;
      computed: true;
    }
  | {
      type: "Property";
      loc?: SourceLocation | null | undefined;
      key: PublicKeyIdentifier | PublicKeyLiteral | PrivateKeyIdentifier;
      value: Pattern;
      kind: "init";
      method: false;
      shorthand: boolean;
      computed: false;
    };

export type SequenceExpression = {
  type: "SequenceExpression";
  loc?: SourceLocation | null | undefined;
  expressions: Expression[];
};

export type UnaryExpression = {
  type: "UnaryExpression";
  loc?: SourceLocation | null | undefined;
  operator: UnaryOperator;
  prefix: true;
  argument: Expression;
};

export type PrivateBinaryExpression = {
  type: "BinaryExpression";
  loc?: SourceLocation | null | undefined;
  operator: "in";
  left: PrivateKeyIdentifier;
  right: Expression;
};

export type RegularBinaryExpression = {
  type: "BinaryExpression";
  loc?: SourceLocation | null | undefined;
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
};

export type BinaryExpression =
  | PrivateBinaryExpression
  | RegularBinaryExpression;

export type AssignmentExpression = {
  type: "AssignmentExpression";
  loc?: SourceLocation | null | undefined;
  operator: AssignmentOperator;
  left: Pattern;
  right: Expression;
};

export type UpdateExpression = {
  type: "UpdateExpression";
  loc?: SourceLocation | null | undefined;
  operator: UpdateOperator;
  argument: Expression;
  prefix: boolean;
};

export type LogicalExpression = {
  type: "LogicalExpression";
  loc?: SourceLocation | null | undefined;
  operator: LogicalOperator;
  left: Expression;
  right: Expression;
};

export type ConditionalExpression = {
  type: "ConditionalExpression";
  loc?: SourceLocation | null | undefined;
  test: Expression;
  alternate: Expression;
  consequent: Expression;
};

export type CallExpression = {
  type: "CallExpression";
  loc?: SourceLocation | null | undefined;
  optional: boolean;
  callee: Expression | Super;
  arguments: Array<Expression | SpreadElement>;
};

export type NewExpression = {
  type: "NewExpression";
  loc?: SourceLocation | null | undefined;
  callee: Expression | Super;
  arguments: Array<Expression | SpreadElement>;
};

export type MemberExpression =
  | {
      type: "MemberExpression";
      loc?: SourceLocation | null | undefined;
      object: Expression | Super;
      property: PublicKeyIdentifier | PrivateKeyIdentifier;
      computed: false;
      optional: boolean;
    }
  | {
      type: "MemberExpression";
      loc?: SourceLocation | null | undefined;
      object: Expression | Super;
      property: Expression;
      computed: true;
      optional: boolean;
    };

export type Pattern =
  | VariableIdentifier
  | ObjectPattern
  | ArrayPattern
  | RestElement
  | AssignmentPattern
  | MemberExpression;

export type SwitchCase = {
  type: "SwitchCase";
  loc?: SourceLocation | null | undefined;
  test?: Expression | null | undefined;
  consequent: Statement[];
};

export type CatchClause = {
  type: "CatchClause";
  loc?: SourceLocation | null | undefined;
  param: Pattern | null;
  body: BlockStatement;
};

export type Literal = SimpleLiteral | RegExpLiteral | BigIntLiteral;

export type SimpleLiteral = {
  type: "Literal";
  loc?: SourceLocation | null | undefined;
  value: string | boolean | number | null;
  raw?: string | undefined;
};

export type RegExpLiteral = {
  type: "Literal";
  loc?: SourceLocation | null | undefined;
  value?: RegExp | null | undefined;
  regex: {
    pattern: string;
    flags: string;
  };
  raw?: string | undefined;
};

export type BigIntLiteral = {
  type: "Literal";
  loc?: SourceLocation | null | undefined;
  value?: bigint | null | undefined;
  bigint: string;
  raw?: string | undefined;
};

export type Super = { type: "Super"; loc?: SourceLocation | null | undefined };

export type SpreadElement = {
  type: "SpreadElement";
  loc?: SourceLocation | null | undefined;
  argument: Expression;
};

export type YieldExpression = {
  type: "YieldExpression";
  loc?: SourceLocation | null | undefined;
  delegate: boolean;
  argument?: Expression | null | undefined;
};

export type TemplateLiteral = {
  type: "TemplateLiteral";
  loc?: SourceLocation | null | undefined;
  quasis: TemplateElement[];
  expressions: Expression[];
};

export type TaggedTemplateExpression = {
  type: "TaggedTemplateExpression";
  loc?: SourceLocation | null | undefined;
  tag: Expression;
  quasi: TemplateLiteral;
};

export type TemplateElement = {
  type: "TemplateElement";
  loc?: SourceLocation | null | undefined;
  tail: boolean;
  value: {
    /** It is null when the template literal is tagged and the text has an invalid escape (e.g. - tag`\unicode and \u{55}`) */
    cooked?: string | null | undefined;
    raw: string;
  };
};

export type ObjectPattern = {
  type: "ObjectPattern";
  loc?: SourceLocation | null | undefined;
  properties: Array<PatternProperty | RestElement>;
};

export type ArrayPattern = {
  type: "ArrayPattern";
  loc?: SourceLocation | null | undefined;
  elements: Array<Pattern | null>;
};

export type RestElement = {
  type: "RestElement";
  loc?: SourceLocation | null | undefined;
  argument: Pattern;
};

export type AssignmentPattern = {
  type: "AssignmentPattern";
  loc?: SourceLocation | null | undefined;
  left: Pattern;
  right: Expression;
};

export type MetaProperty = {
  type: "MetaProperty";
  loc?: SourceLocation | null | undefined;
  meta: MetaIdentifier;
  property: MetaIdentifier;
};

export type ImportExpression = {
  type: "ImportExpression";
  loc?: SourceLocation | null | undefined;
  source: Expression;
};

export type AwaitExpression = {
  type: "AwaitExpression";
  loc?: SourceLocation | null | undefined;
  argument: Expression;
};

//////////////
// Function //
//////////////

export type Function =
  | FunctionExpression
  | ArrowFunctionExpression
  | FunctionDeclaration
  | AnonymousDefaultExportedFunctionDeclaration;

export type FunctionExpression = {
  type: "FunctionExpression";
  loc?: SourceLocation | null | undefined;
  id?: VariableIdentifier | null | undefined;
  async?: boolean | null | undefined;
  generator?: boolean | null | undefined;
  params: Pattern[];
  body: BlockStatement;
};

export type ArrowFunctionExpression =
  | {
      type: "ArrowFunctionExpression";
      loc?: SourceLocation | null | undefined;
      async?: boolean | null | undefined;
      generator?: false | null | undefined;
      params: Pattern[];
      expression: true;
      body: Expression;
    }
  | {
      type: "ArrowFunctionExpression";
      loc?: SourceLocation | null | undefined;
      async?: boolean | null | undefined;
      generator?: false | null | undefined;
      params: Pattern[];
      expression: false;
      body: BlockStatement;
    };

export type FunctionDeclaration = {
  type: "FunctionDeclaration";
  loc?: SourceLocation | null | undefined;
  params: Pattern[];
  id: VariableIdentifier;
  generator?: boolean;
  async?: boolean;
  body: BlockStatement;
};

export type AnonymousDefaultExportedFunctionDeclaration = {
  type: "FunctionDeclaration";
  loc?: SourceLocation | null | undefined;
  params: Pattern[];
  id?: null | undefined;
  generator?: boolean;
  async?: boolean;
  body: BlockStatement;
};

///////////
// Class //
///////////

export type Class =
  | ClassExpression
  | ClassDeclaration
  | AnonymousDefaultExportedClassDeclaration;

export type MethodDefinition =
  | {
      type: "MethodDefinition";
      loc?: SourceLocation | null | undefined;
      key: Expression;
      value: FunctionExpression;
      kind: "method" | "get" | "set";
      computed: true;
      static: boolean;
    }
  | {
      type: "MethodDefinition";
      loc?: SourceLocation | null | undefined;
      key: PublicKeyIdentifier | PublicKeyLiteral | PrivateKeyIdentifier;
      value: FunctionExpression;
      kind: "method" | "get" | "set";
      computed: false;
      static: boolean;
    }
  | {
      type: "MethodDefinition";
      loc?: SourceLocation | null | undefined;
      key: ConstructorIdentifier;
      value: FunctionExpression;
      kind: "constructor";
      computed: false;
      static: false;
    };

export type ClassExpression = {
  type: "ClassExpression";
  loc?: SourceLocation | null | undefined;
  id?: VariableIdentifier | null | undefined;
  superClass?: Expression | null | undefined;
  body: ClassBody;
};

export type AnonymousDefaultExportedClassDeclaration = {
  type: "ClassDeclaration";
  loc?: SourceLocation | null | undefined;
  id?: null | undefined;
  superClass?: Expression | null | undefined;
  body: ClassBody;
};

export type ClassDeclaration = {
  type: "ClassDeclaration";
  loc?: SourceLocation | null | undefined;
  id: VariableIdentifier;
  superClass?: Expression | null | undefined;
  body: ClassBody;
};

export type ClassBody = {
  type: "ClassBody";
  loc?: SourceLocation | null | undefined;
  body: Array<MethodDefinition | PropertyDefinition | StaticBlock>;
};

export type PropertyDefinition =
  | {
      type: "PropertyDefinition";
      loc?: SourceLocation | null | undefined;
      key: Expression;
      value?: Expression | null | undefined;
      computed: true;
      static: boolean;
    }
  | {
      type: "PropertyDefinition";
      loc?: SourceLocation | null | undefined;
      key: PublicKeyIdentifier | PublicKeyLiteral | PrivateKeyIdentifier;
      value?: Expression | null | undefined;
      computed: false;
      static: boolean;
    };

export type StaticBlock = {
  type: "StaticBlock";
  loc?: SourceLocation | null | undefined;
  body: Statement[];
};

///////////////////////
// ModuleDeclaration //
///////////////////////

export type ModuleDeclaration =
  | ImportDeclaration
  | ExportNamedDeclaration
  | ExportDefaultDeclaration
  | ExportAllDeclaration;

export type ImportDeclaration = {
  type: "ImportDeclaration";
  loc?: SourceLocation | null | undefined;
  specifiers: Array<
    ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
  >;
  source: SourceLiteral;
};

export type ImportSpecifier = {
  type: "ImportSpecifier";
  loc?: SourceLocation | null | undefined;
  imported: SpecifierIdentifier | SpecifierLiteral;
  local: VariableIdentifier;
};

export type ImportDefaultSpecifier = {
  type: "ImportDefaultSpecifier";
  loc?: SourceLocation | null | undefined;
  local: VariableIdentifier;
};

export type ImportNamespaceSpecifier = {
  type: "ImportNamespaceSpecifier";
  loc?: SourceLocation | null | undefined;
  local: VariableIdentifier;
};

export type ExportNamedDeclaration =
  | {
      type: "ExportNamedDeclaration";
      loc?: SourceLocation | null | undefined;
      declaration?: null | undefined;
      specifiers: ExportSpecifier[];
      source?: null | undefined;
    }
  | {
      type: "ExportNamedDeclaration";
      loc?: SourceLocation | null | undefined;
      declaration?: null | undefined;
      specifiers: AggregatExportSpecifier[];
      source: SourceLiteral;
    }
  | {
      type: "ExportNamedDeclaration";
      loc?: SourceLocation | null | undefined;
      declaration?:
        | FunctionDeclaration
        | ClassDeclaration
        | VariableDeclaration
        | null
        | undefined;
      specifiers: [];
      source?: null | undefined;
    };

export type AggregatExportSpecifier = {
  type: "ExportSpecifier";
  loc?: SourceLocation | null | undefined;
  exported: SpecifierIdentifier | SpecifierLiteral;
  local: SpecifierIdentifier | SpecifierLiteral;
};

export type ExportSpecifier = {
  type: "ExportSpecifier";
  loc?: SourceLocation | null | undefined;
  exported: SpecifierIdentifier | SpecifierLiteral;
  local: VariableIdentifier;
};

export type ExportDefaultDeclaration = {
  type: "ExportDefaultDeclaration";
  loc?: SourceLocation | null | undefined;
  declaration:
    | AnonymousDefaultExportedFunctionDeclaration
    | FunctionDeclaration
    | AnonymousDefaultExportedClassDeclaration
    | ClassDeclaration
    | Expression;
};

export type ExportAllDeclaration = {
  type: "ExportAllDeclaration";
  loc?: SourceLocation | null | undefined;
  exported?: SpecifierIdentifier | SpecifierLiteral | null | undefined;
  source: SourceLiteral;
};
