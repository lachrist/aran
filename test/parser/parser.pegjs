
// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-ReservedWord

{
  const ReservedWords = [
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
    "false"
  ];
  const AranReservedWords = [
    "root",
    "arguments",
    "eval",
    "evalcheck"
  ];
}

StartExpression = Expression _

StartBlock = Block _

StartStatement = Statement _

/////////////
// Unicode //
/////////////
  
UnicodeEscapeSequence = UnicodeFixedEscapeSequence / UnicodeFlexibleEscapeSequence

UnicodeFixedEscapeSequence = "\\u" s:$([0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) { return String.fromCodePoint(parseInt(s, 16)) }

UnicodeFlexibleEscapeSequence = "\\u{" s:$([0-9a-fA-F]+) & { return parseInt(s, 16) <= 0x10FFFF } "}" { return String.fromCodePoint(parseInt(s, 16)) }

//////////
// JSON //
//////////

// https://www.json.org/json-en.html

JSONString = "\"" ss:(JSONStringEscapeSequence / [^\"\\\u0000-\u001F])* "\"" { return ss.join("") }

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

JSONNumber = s1:$("-"? ("0" / [1-9][0-9]*)) s2:$(("." [0-9]+)?) s3:$(([eE] [+-]? [0-9]+)?) { return (s2 === "" && s3 === "") ? parseInt(s1, 10) : parseFloat(s1 + s2 + s3, 10) }

////////////////
// ECMAScript //
////////////////

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Identifier
// https://javascript.info/regexp-unicode
// https://mathiasbynens.be/notes/javascript-identifiers

ESIdentifier = s:ESIdentifierName & { return !ReservedWords.includes(s) } { return s }

ESIdentifierName = s:ESIdentifierStart ss:ESIdentifierPart* { return s + ss.join("") }

ESIdentifierStart = s:(UnicodeEscapeSequence / .) & { return /\p{ID_Start}|\$|_/u.test(s) } { return s }

ESIdentifierPart = s:(UnicodeEscapeSequence / .) & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(s) } { return s }

/////////////
// Helpers //
/////////////

_ = [ \n\t]*

__ = !ESIdentifierPart

Identifier = word:ESIdentifier & { return !AranReservedWords.includes(word) } { return word }

Label = ESIdentifier

String = JSONString

Number = JSONNumber

UnaryOperator
  = "typeof" __ { return "typeof" }
  / "+"
  / "-"
  / "~"
  / "!"

BinaryOperator
  = "in" __ { return "in" }
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

///////////
// Block //
///////////

Block
  = _ "{" _ "let" __ _ i1:Identifier is:(_ "," _ i2:Identifier { return i2 })* _ ";" ss:(Statement*) _ "}" { return ["BLOCK", [i1].concat(is), ss] }
  / _ "{" ss:(Statement*) _ "}"                                                                          { return ["BLOCK", [], ss] }

Statement
  = /* Lift */     e:Expression _ ";"                                                                            { return ["Lift", e] }
  / /* Return */   _ "return" __ e:Expression _ ";"                                                              { return ["Return", e] }
  / /* Break */    _ "break" __ _ l:Label _ ";"                                                                  { return ["Break", l] }
  / /* Continue */ _ "continue" __ _ l:Label _ ";"                                                               { return ["Continue", l] }
  / /* Debugger */ _ "debugger" _ ";"                                                                            { return ["Debugger"] }
  / /* Lone */     ls:(_ l:Label _ ":" { return l })* b:Block                                                    { return ["Lone", ls, b] }
  / /* If */       ls:(_ l:Label _ ":" { return l })* _ "if" _ "(" e:Expression _ ")" b1:Block _ "else" b2:Block { return ["If", ls, e, b1, b2] }
  / /* While */    ls:(_ l:Label _ ":" { return l })* _ "while" _ "(" e:Expression _ ")" b:Block                 { return ["While", ls, e, b] }
  / /* Try */      ls:(_ l:Label _ ":" { return l })* _ "try" b1:Block _ "catch" b2:Block _ "finally" b3:Block   { return ["Try", ls, b1, b2, b3] }

Expression = ApplyExpression / NonApplyExpression

ApplyExpression
  = /* Apply */ e1:NonApplyExpression _ "(" _ "@" e2:Expression es:( _ "," e3:Expression { return e3 })* _ ")" { return ["apply", e1, e2, es] }
  / /* Apply */ e1:NonApplyExpression _ "(" e2:Expression es:( _ "," e3:Expression { return e3 })* _ ")"       { return ["apply", e1, ["primitive", void 0], [e2].concat(es)] }
  / /* Apply */ e1:NonApplyExpression _ "(" _ ")"                                                              { return ["apply", e1, ["primitive", void 0], []] }

NonApplyExpression
  = /* Primitive */   _ "void" __ _ "0"                                                                                                              { return ["primitive", void 0] }
  / /* Primitive */   _ "null" __                                                                                                                    { return ["primitive", null] }
  / /* Primitive */   _ "false" __                                                                                                                   { return ["primitive", false] }
  / /* Primitive */   _ "true" __                                                                                                                    { return ["primitive", true] }
  / /* Primitive */   _ n:Number                                                                                                                     { return ["primitive", n] }
  / /* Primitive */   _ s:String                                                                                                                     { return ["primitive", s] }
  / /* Builtin */     _ "#" _ s:String                                                                                                               { return ["builtin", s] }
  / /* Builtin */     _ "#" _ i1:Identifier is:(_ "." i2:Identifier { return i2})*                                                                   { return ["builtin", is.join(".")] }
  / /* Arrow */       _ "(" _ ")" _ "=>" b:Block                                                                                                     { return ["arrow", b] }
  / /* Function */    _ "function" _ "(" _ ")" b:Block                                                                                               { return ["function", b] }
  / /* Read */        _ i:Identifier                                                                                                                 { return ["read", i] }
  / /* Write */       _ "(" _ i:Identifier _ "=" e:Expression _ ")"                                                                                  { return ["write", i, e] }
  / /* Sequence */    _ "(" e1:Expression _ "," e2:Expression _ ")"                                                                                  { return ["sequence", e1, e2] }
  / /* Conditional */ _ "(" e1:Expression _ "?" e2:Expression _ ":" e3:Expression _ ")"                                                              { return ["conditional", e1, e2, e3] }
  / /* Throw */       _ "throw" __ e:Expression                                                                                                      { return ["throw", e] }
  / /* Eval */        _ "eval" _ "(" _ "§" _ i1:Identifier is:( _ "," _ "§" _ i2:Identifier { return i2 }) _ "," e:Expression _ ")"                  { return ["eval", [i1].concat(is), e] }
  / /* Eval */        _ "eval" _ "(" e:Expression _ ")"                                                                                              { return ["eval", [], e] }
  / /* Unary */       _ o:UnaryOperator e:Expression                                                                                                 { return ["unary", o, e] }
  / /* Binary */      _ "(" e1:Expression _ o:BinaryOperator e2:Expression _ ")"                                                                     { return ["binary", o, e1, e2] }
  / /* Construct */   _ "new" __ e:NonApplyExpression _ "(" _ ")"                                                                                    { return ["construct", e, []] }
  / /* Construct */   _ "new" __ e1:NonApplyExpression _ "(" e2:Expression es:( _ "," e3:Expression { return e3 })* _ ")"                            { return ["construct", e1, [e2].concat(es)] }
  / /* Object */      _ "{" _ "__proto__" _ ":" e1:Expression ps:( _ "," _ "[" e2:Expression _ "]" _ ":" _ e3:Expression { return [e2, e3] })* _ "}" { return ["object", e1, ps] }
  / /* Parenthesis */ _ "(" e:Expression _ ")"                                                                                                       { return e }
