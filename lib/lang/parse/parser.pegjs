
// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-ReservedWord

{
  const Tree = require("../../tree.js");
  const aran_keywords = [
    "enclave",
    "error",
    "method",
    "constructor",
    "aggregate",
    "require"
  ];
  const keywords = [
    // Keywords //
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "exports",
    "extends",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "await",  // context-dependent
    "let",    // strict mode
    "static", // strict mode
    "yield",  // context-dependent
    // FutureReservedWord //
    "enum",
    "implements", // strict mode
    "package",    // strict mode
    "protected",  // strict mode
    "interface",  // strict mode
    "private",    // strict mode
    "public",     // strict mode
    // NullLiteral
    "null",
    // BooleanLiteral //
    "true",
    "false",
    // Special //
    "arguments",
    "eval"
  ];
}

StartProgram = _ p:Program _ { return p }

StartPrelude = _ p:Prelude _ { return p }

StartBlock = _ b:Block _ { return b }

StartStatement = ss:_Statement* _ { return ss.length === 1 ? ss[0] : Tree.Bundle(ss) }

StartExpression = _ e:Expression _ { return e }

/////////////
// Unicode //
/////////////

UnicodeEscapeSequence = UnicodeFixedEscapeSequence / UnicodeFlexibleEscapeSequence

UnicodeFixedEscapeSequence
  = "\\u" s:$([0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F])
  { return String.fromCodePoint(parseInt(s, 16)) }

UnicodeFlexibleEscapeSequence
  = "\\u{" s:$([0-9a-fA-F]+) & { return parseInt(s, 16) <= 0x10FFFF } "}"
  { return String.fromCodePoint(parseInt(s, 16)) }

//////////
// JSON //
//////////

// https://www.json.org/json-en.html

JSONString
  = "\"" ss:(JSONStringEscapeSequence / [^\"\\\u0000-\u001F])* "\""
  { return ss.join("") }

JSONStringEscapeSequence
  = "\\\"" { return "\"" }
  / "\\\\" { return "\\" }
  / "\\\/" { return "\/" }
  / "\\b"  { return "\b" }
  / "\\f"  { return "\f" }
  / "\\n"  { return "\n" }
  / "\\r"  { return "\r" }
  / "\\t"  { return "\t" }
  / UnicodeFixedEscapeSequence

JSONNumber
  = s1:$("-"? ("0" / [1-9][0-9]*)) s2:$(("." [0-9]+)?) s3:$(([eE] [+-]? [0-9]+)?)
  { return (s2 === "" && s3 === "") ? parseInt(s1, 10) : parseFloat(s1 + s2 + s3, 10) }

////////////////
// ECMAScript //
////////////////

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Identifier
// https://javascript.info/regexp-unicode
// https://mathiasbynens.be/notes/javascript-identifiers

IdentifierName
  = s:IdentifierStart ss:IdentifierPart*
  { return s + ss.join("") }

IdentifierStart
  = s:(UnicodeEscapeSequence / .)
  & { return /\p{ID_Start}|\$|_/u.test(s) }
  { return s }

IdentifierPart
  = s:(UnicodeEscapeSequence / .)
  & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(s) }
  { return s }

/////////////
// Helpers //
/////////////

Label
  = s:IdentifierName
  & { return !keywords.includes(s) && !aran_keywords.includes(s) }
  { return s }

Identifier
  = s:IdentifierName
  & { return !keywords.includes(s) && !aran_keywords.includes(s) }
  { return s }

EnclaveReadIdentifier
  = s:IdentifierName
  & { return s === "eval" || s === "argument" || !keywords.includes(s) }
  { return s }

EnclaveWriteIdentifier
  = s:IdentifierName
  & { return !keywords.includes(s) }
  { return s }

Specifier = IdentifierName

Comment
  = "/*" (!"*/" .)* "*/"
  / "//" [^\n]*

_ = ([ \n\t] / Comment)*

__ = !IdentifierPart

String = JSONString

Number = JSONNumber

BigInt = s:$([0-9]+) "n" { return BigInt(s) }

/////////////
// Program //
/////////////

Program = ps:_Prelude* b:Block { return Tree._program(ps, b) }

/////////////
// Prelude //
/////////////

_Prelude = _ p:Prelude { return p }

Prelude
  = /* Import */    "import"    _ "*"          _ "from" _ s:String                       _ ";" { return Tree._import(null, s) }
  / /* Import */    "import"    _ i1:Specifier _ "from" _ s:String                       _ ";" { return Tree._import(i1, s) }
  / /* Export */    "export"                                              _ i2:Specifier _ ";" { return Tree._export(i2) }
  / /* Aggregate */ "aggregate" _ "*"          _ "from" _ s:String                       _ ";" { return Tree._aggregate(null, s, null) }
  / /* Aggregate */ "aggregate" _ i1:Specifier _ "from" _ s:String _ "as" _ i2:Specifier _ ";" { return Tree._aggregate(i1, s, i2) }

///////////
// Block //
///////////

_ComaIdentifier = _ "," _ s:Identifier { return s }

Block
  = _ "{" _ "let" __ _ s:Identifier ss:_ComaIdentifier* _ ";" xs:(_Statement*) _ "}" { return Tree.BLOCK([s].concat(ss), xs) }
  / _ "{" ss:(_Statement*) _ "}"                                                     { return Tree.BLOCK([], ss) }

///////////////
// Statement //
///////////////

LabelColon = _ l:Label _ ":" { return l }

_Statement = _ s:Statement { return s }

Statement
  = /* Lift */                      e:Expression   _ ";"                                          { return Tree.Lift(e) }
  / /* Return */    "return"   __ _ e:Expression   _ ";"                                          { return Tree.Return(e) }
  / /* Break */     "break"    __ _ l:Label        _ ";"                                          { return Tree.Break(l) }
  / /* Continue */  "continue" __ _ l:Label        _ ";"                                          { return Tree.Continue(l) }
  / /* Debugger */  "debugger"                     _ ";"                                          { return Tree.Debugger() }
  / /* Lone */      ls:LabelColon* _ b:Block                                                      { return Tree.Lone(ls, b) }
  / /* If */        ls:LabelColon* _ "if" _ & "(" _ e:Expression _ b1:Block _ "else" _ b2:Block   { return Tree.If(ls, e, b1, b2) }
  / /* While */     ls:LabelColon* _ "while" _ & "(" _ e:Expression _ b:Block                     { return Tree.While(ls, e, b) }
  / /* Try */       ls:LabelColon* _ "try" _ b1:Block _ "catch" _ b2:Block _ "finally" _ b3:Block { return Tree.Try(ls, b1, b2, b3) }

////////////////
// Expression //
////////////////

_ComaProperty
  =  _ "," _ "[" _ e1:Expression _ "]" _ ":" _ e2:Expression { return [e1, e2] }
  /  _ "," _ s:String                  _ ":" _ e2:Expression { return [Tree.primitive(s), e2] }
  /  _ "," _ i:IdentifierName          _ ":" _ e2:Expression { return [Tree.primitive(i), e2] }

_ComaExpression = _ "," _ e:Expression { return e }

_DotIdentifierName = _ "." _ s:IdentifierName { return s }

_ApplyTail
  = _ "(" _ "@" _ e1:Expression es:_ComaExpression* _ ")" { return [e1, es] }
  / _ "("       _ e1:Expression es:_ComaExpression* _ ")" { return [Tree.primitive(undefined), [e1].concat(es)] }
  / _ "("                                           _ ")" { return [Tree.primitive(undefined), []] }

ConstructTail
  = "(" _ e:Expression es:_ComaExpression* _ ")" { return [e].concat(es) }
  / "("                                    _ ")" { return [] }

UnaryOperator
  = "typeof" __ { return "typeof" }
  / "+"
  / "-"
  / "~"
  / "!"

BinaryOperator
  = "in"         __ { return "in" }
  / "instanceof" __ { return "instanceof" }
  / "**"
  / "*"
  / "/"
  / "%"
  / "+"
  / "-"
  / "&"
  / "^"
  / "|"
  / "<<"
  / "<="
  / "<"
  / ">>>"
  / ">>"
  / ">="
  / ">"
  / "==="
  / "=="
  / "!=="
  / "!="

Expression
  = e:NonApplyExpression xs:_ApplyTail*
  { return xs.reduce((e, x) => Tree.apply(e, x[0], x[1]), e) }

NonApplyExpression
  = /* Primitive */     "void" __ _ "0"                                                      { return Tree.primitive(void 0) }
  / /* Primitive */     "null" __                                                            { return Tree.primitive(null) }
  / /* Primitive */     "false" __                                                           { return Tree.primitive(false) }
  / /* Primitive */     "true" __                                                            { return Tree.primitive(true) }
  / /* Primitive */     i:BigInt                                                             { return Tree.primitive(i) }
  / /* Primitive */     n:Number                                                             { return Tree.primitive(n) }
  / /* Primitive */     s:String                                                             { return Tree.primitive(s) }
  / /* Import */        "import" _ "*"         _ "from" _ s:String                           { return Tree.import(null, s) }
  / /* Import */        "import" _ i:Specifier _ "from" _ s:String                           { return Tree.import(i, s) }
  / /* Intrinsic */     "#" _ s:String                                                       { return Tree.intrinsic(s) }
  / /* Intrinsic */     "#" _ s:IdentifierName ss:_DotIdentifierName*                        { return Tree.intrinsic([s].concat(ss).join(".")) }
  / /* Arrow */         "(" _ ")" _ "=>" _ b:Block                                           { return Tree.arrow(b) }
  / /* Function */      "function" _ "(" _ ")" _ b:Block                                     { return Tree.function(b) }
  / /* Constructor */   "constructor" _ "(" _ ")" _ b:Block                                  { return Tree.constructor(b) }
  / /* Constructor */   "method" _ "(" _ ")" _ b:Block                                       { return Tree.method(b) }
  / /* Export */        "export" _ i:Specifier _ e:Expression                                { return Tree.export(i, e) }
  / /* Write */         i:Identifier _ "=" _ e:Expression                                    { return Tree.write(i, e) }
  / /* Read */          i:Identifier                                                         { return Tree.read(i) }
  / /* EnclaveWrite */  "enclave" _ "?"      _ i:EnclaveWriteIdentifier _ "=" _ e:Expression { return Tree.enclave_write(false, i, e) }
  / /* EnclaveWrite */  "enclave" _ "!"      _ i:EnclaveWriteIdentifier _ "=" _ e:Expression { return Tree.enclave_write(true, i, e) }
  / /* EnclaveRead */   "enclave"            _ i:EnclaveReadIdentifier                       { return Tree.enclave_read(i) }
  / /* EnclaveTypeof */ "enclave" _ "typeof" _ i:EnclaveReadIdentifier                       { return Tree.enclave_typeof(i) }
  / /* Throw */         "throw" _ e:Expression                                               { return Tree.throw(e) }
  / /* Eval */          "eval" _ e:Expression _                                              { return Tree.eval(e) }
  / /* Require */       "require" _ e:Expression _                                           { return Tree.require(e) }
  / /* Unary */         o:UnaryOperator _ e:Expression                                       { return Tree.unary(o, e) }
  / /* Construct */     "new" __ _ e:NonApplyExpression _ es:ConstructTail                   { return Tree.construct(e, es) }
  / /* Object */        "{" _ "__proto__" _ ":" _ e:Expression ps:_ComaProperty* _ "}"       { return Tree.object(e, ps) }
  / /* Head */          "(" _ e:Expression _ t:ExpressionTail                                { switch (t[0]) {
                                                                                                case "parenthesis": return e;
                                                                                                case "sequence": return Tree.sequence(e, t[1]);
                                                                                                case "binary": return Tree.binary(t[1], e, t[2]);
                                                                                                case "conditional": return Tree.conditional(e, t[1], t[2]);
                                                                                              }
                                                                                              throw new global.Error("Unexpected tail"); }

ExpressionTail
  = ")"                                             { return ["parenthesis"] }
  / "," _ e:Expression _ ")"                        { return ["sequence", e] }
  / o:BinaryOperator _ e:Expression _ ")"           { return ["binary", o, e] }
  / "?" _ e1:Expression _ ":" _ e2:Expression _ ")" { return ["conditional", e1, e2] }
