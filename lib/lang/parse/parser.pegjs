
// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-ReservedWord

{
  const Tree = require("../../tree.js");
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
    // AranSpecific //
    "eval",
    "method",
    "constructor",
    "aggregate",
    "require"
  ];
}

StartProgram = p:Program _ { return p }

StartPrelude = p:Prelude _ { return p }

StartBlock = b:Block _ { return b }

StartStatement = ss:Statement* _ { return ss.length === 1 ? ss[0] : Tree.Bundle(ss) }

StartExpression = e:Expression _ { return e }

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
  & { return !keywords.includes(s) }
  { return s }

Identifier
  = s:IdentifierName
  & { return !keywords.includes(s) }
  { return s }
  / "new.target"
  / "import.meta"
  / "this"

Declarable
  = s:IdentifierName
  & { return !keywords.includes(s) && s !== "callee" &&  s !== "error" && s !== "arguments" }
  { return s }

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

Program = ps:Prelude* b:Block { return Tree._program(ps, b) }

/////////////
// Prelude //
/////////////

Prelude
  = /* Import */    _ "import"    _ "*"               _ "from" _ s:String                            _ ";" { return Tree._import(null, s) }
  / /* Import */    _ "import"    _ i1:IdentifierName _ "from" _ s:String                            _ ";" { return Tree._import(i1, s) }
  / /* Export */    _ "export"                                                   _ i2:IdentifierName _ ";" { return Tree._export(i2) }
  / /* Aggregate */ _ "aggregate" _ "*"               _ "from" _ s:String                            _ ";" { return Tree._aggregate(null, s, null) }
  / /* Aggregate */ _ "aggregate" _ "*"               _ "from" _ s:String _ "as" _ i2:IdentifierName _ ";" { return Tree._aggregate(null, s, i2) }
  / /* Aggregate */ _ "aggregate" _ i1:IdentifierName _ "from" _ s:String _ "as" _ i2:IdentifierName _ ";" { return Tree._aggregate(i1, s, i2) }

///////////
// Block //
///////////

ComaDeclarable = _ "," _ s:Declarable { return s }

Block
  = _ "{" _ "let" __ _ s:Identifier ss:ComaDeclarable* _ ";" xs:(Statement*) _ "}" { return Tree.BLOCK([s].concat(ss), xs) }
  / _ "{" ss:(Statement*) _ "}"                                                    { return Tree.BLOCK([], ss) }

///////////////
// Statement //
///////////////

LabelColon = _ l:Label _ ":" { return l }

Statement
  = /* Lift */                        e:Expression _ ";"                                       { return Tree.Lift(e) }
  / /* Return */    _ "return" __     e:Expression _ ";"                                       { return Tree.Return(e) }
  / /* Break */     _ "break" __ _    l:Label      _ ";"                                       { return Tree.Break(l) }
  / /* Continue */  _ "continue" __ _ l:Label      _ ";"                                       { return Tree.Continue(l) }
  / /* Debugger */  _ "debugger"                   _ ";"                                       { return Tree.Debugger() }
  / /* Lone */      ls:LabelColon*                                   b:Block                   { return Tree.Lone(ls, b) }
  / /* If */        ls:LabelColon* _ "if"    _ & "(" e:Expression _ b1:Block _ "else" b2:Block { return Tree.If(ls, e, b1, b2) }
  / /* While */     ls:LabelColon* _ "while" _ & "(" e:Expression b:Block                      { return Tree.While(ls, e, b) }
  / /* Try */       ls:LabelColon* _ "try" b1:Block _ "catch" b2:Block _ "finally" b3:Block    { return Tree.Try(ls, b1, b2, b3) }

////////////////
// Expression //
////////////////

ComaProperty
  =  _ "," _ "[" e1:Expression _ "]" _ ":" e2:Expression { return [e1, e2] }
  /  _ "," _      i:IdentifierName _ ":" e:Expression  { return [Tree.primitive(i), e] }

ComaExpression = _ "," e:Expression { return e }

DotIdentifierName = _ "." _ s:IdentifierName { return s }

ApplyTail
  = _ "(" _ "@" e1:Expression es:ComaExpression* _ ")" { return [e1, es] }
  / _ "("       e1:Expression es:ComaExpression* _ ")" { return [Tree.primitive(undefined), [e1].concat(es)] }
  / _ "("                                        _ ")" { return [Tree.primitive(undefined), []] }

ConstructTail
  = _ "(" e:Expression es:ComaExpression* _ ")" { return [e].concat(es) }
  / _ "("                                 _ ")" { return [] }

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
  = e:NonApplyExpression xs:ApplyTail*
  { return xs.reduce((e, x) => Tree.apply(e, x[0], x[1]), e) }

NonApplyExpression
  = /* Primitive */   _ "void" __ _ "0"                                                 { return Tree.primitive(void 0) }
  / /* Primitive */   _ "null" __                                                       { return Tree.primitive(null) }
  / /* Primitive */   _ "false" __                                                      { return Tree.primitive(false) }
  / /* Primitive */   _ "true" __                                                       { return Tree.primitive(true) }
  / /* Primitive */   _ i:BigInt                                                        { return Tree.primitive(i) }
  / /* Primitive */   _ n:Number                                                        { return Tree.primitive(n) }
  / /* Primitive */   _ s:String                                                        { return Tree.primitive(s) }
  / /* Import */      _ "import" _ "*"              _ "from" _ s:String                 { return Tree.import(null, s) }
  / /* Import */      _ "import" _ i:IdentifierName _ "from" _ s:String                 { return Tree.import(i, s) }
  / /* Builtin */     _ "#" _ s:String                                                  { return Tree.builtin(s) }
  / /* Builtin */     _ "#" _ s:IdentifierName ss:DotIdentifierName*                    { return Tree.builtin([s].concat(ss).join(".")) }
  / /* Arrow */       _ "(" _ ")" _ "=>" b:Block                                        { return Tree.arrow(b) }
  / /* Function */    _ "function" _ "(" _ ")" b:Block                                  { return Tree.function(b) }
  / /* Constructor */ _ "constructor" _ "(" _ ")" b:Block                               { return Tree.constructor(b) }
  / /* Constructor */ _ "method" _ "(" _ ")" b:Block                                    { return Tree.method(b) }
  / /* Export */      _ "export" _ i:IdentifierName _ e:Expression                      { return Tree.export(i, e) }
  / /* Write */       _ i:Identifier _ "=" e:Expression                                 { return Tree.write(i, e) }
  / /* Read */        _ i:Identifier                                                    { return Tree.read(i) }
  / /* Sequence */    _ "(" e1:Expression _ "," e2:Expression _ ")"                     { return Tree.sequence(e1, e2) }
  / /* Conditional */ _ "(" e1:Expression _ "?" e2:Expression _ ":" e3:Expression _ ")" { return Tree.conditional(e1, e2, e3) }
  / /* Throw */       _ "throw" _ e:Expression                                          { return Tree.throw(e) }
  / /* Eval */        _ "eval" _ e:Expression _                                         { return Tree.eval(e) }
  / /* Require */     _ "require" _ e:Expression _                                      { return Tree.require(e) }
  / /* Unary */       _ o:UnaryOperator e:Expression                                    { return Tree.unary(o, e) }
  / /* Binary */      _ "(" e1:Expression _ o:BinaryOperator e2:Expression _ ")"        { return Tree.binary(o, e1, e2) }
  / /* Construct */   _ "new" __ e:NonApplyExpression es:ConstructTail                  { return Tree.construct(e, es) }
  / /* Object */      _ "{" _ "__proto__" _ ":" e:Expression ps:ComaProperty* _ "}"     { return Tree.object(e, ps) }
  / /* Parenthesis */ _ "(" e:Expression _ ")"                                          { return e }
