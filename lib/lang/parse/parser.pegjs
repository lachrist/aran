
// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-ReservedWord

{
  const Tree = require("../../tree.js");
  const aran_keywords = [
    "enclave",
    "error",
    "arrow",
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

StartProgram = _ p:Program _ { return p; }

StartPrelude = _ p:Prelude _ { return p; }

StartBlock = b:_Block _ { return b; }

StartStatement = ss:_Statement* _ { return ss.length === 1 ? ss[0] : Tree.Bundle(ss); }

StartExpression = _ e:Expression _ { return e; }

/////////////
// Unicode //
/////////////

UnicodeEscapeSequence = UnicodeFixedEscapeSequence / UnicodeFlexibleEscapeSequence

UnicodeFixedEscapeSequence
  = "\\u" s:$([0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F])
  { return String.fromCodePoint(parseInt(s, 16)); }

UnicodeFlexibleEscapeSequence
  = "\\u{" s:$([0-9a-fA-F]+) & { return parseInt(s, 16) <= 0x10FFFF } "}"
  { return String.fromCodePoint(parseInt(s, 16)); }

//////////
// JSON //
//////////

// https://www.json.org/json-en.html

JSONString
  = "\"" ss:(JSONStringEscapeSequence / [^\"\\\u0000-\u001F])* "\""
  { return ss.join(""); }

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
  { return (s2 === "" && s3 === "") ? parseInt(s1, 10) : parseFloat(s1 + s2 + s3, 10); }

////////////////
// ECMAScript //
////////////////

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Identifier
// https://javascript.info/regexp-unicode
// https://mathiasbynens.be/notes/javascript-identifiers

IdentifierName
  = s:IdentifierStart ss:IdentifierPart*
  { return s + ss.join(""); }

IdentifierStart
  = s:.
  & { return /\p{ID_Start}|\$|_/u.test(s) }
  { return s; }

IdentifierPart
  = s:.
  & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(s) }
  { return s; }

/////////////
// Helpers //
/////////////

Label
  = s:IdentifierName
  & { return !keywords.includes(s) && !aran_keywords.includes(s) }
  { return s; }

Identifier
  = s:IdentifierName
  & { return !keywords.includes(s) && !aran_keywords.includes(s) }
  { return s; }

EnclaveIdentifier
  = s:IdentifierName
  & { return !keywords.includes(s) }
  { return s; }

Specifier = IdentifierName

Comment
  = "/*" (!"*/" .)* "*/"
  / "//" [^\n]*

_ = ([ \n\t] / Comment)*

__ = !IdentifierPart

String = JSONString

Number = JSONNumber

BigInt = s:$([0-9]+) "n" { return BigInt(s); }

/////////////
// Program //
/////////////

Program = ps:_Prelude* b:_Block { return Tree._program(ps, b) }

/////////////
// Prelude //
/////////////

_Prelude = _ p:Prelude { return p; };

Prelude
  = "import" _ p:ImportPrelude { return p; }
  / "export" _ i2:Specifier _ ";" { return Tree._export(i2); }
  / "aggregate" _ p:AggregatePrelude { return p; }

ImportPrelude
  = "*"          _ "from" _ s:String _ ";" { return Tree._import(null, s); }
  / i1:Specifier _ "from" _ s:String _ ";" { return Tree._import(i1, s); }

AggregatePrelude
  = "*"          _ "from" _ s:String                       _ ";" { return Tree._aggregate(null, s, null); }
  / i1:Specifier _ "from" _ s:String _ "as" _ i2:Specifier _ ";" { return Tree._aggregate(i1, s, i2); }

///////////
// Block //
///////////

_Block = ls:_LabelColon* _ "{" _ is:Declaration ss:(_Statement*) _ "}" { return Tree.BLOCK(ls, is, ss); }

_LabelColon = _ l:Label _ ":" { return l; }

Declaration
  = "let" __ _ i:Identifier is:_ComaIdentifier* _ ";" { return [i].concat(is); }
  / "" { return [] }

_ComaIdentifier = _ "," _ s:Identifier { return s; }

///////////////
// Statement //
///////////////

_Statement = _ s:Statement { return s }

Statement
  = "if" _ & "(" _ e:Expression b1:_Block _ "else" b2:_Block   { return Tree.If(e, b1, b2); }
  / "while" _ & "(" _ e:Expression b:_Block                    { return Tree.While(e, b); }
  / "try" b1:_Block _ "catch" b2:_Block _ "finally" b3:_Block  { return Tree.Try(b1, b2, b3); }
  / b:_Block                                                   { return Tree.Lone(b); }
  / "enclave"  __ _ k:("var" / "let" / "const") _ i:EnclaveIdentifier _ "=" _ e:Expression _ ";" { return Tree.EnclaveDeclare(k, i, e) }
  / "return"   __ _ e:Expression _ ";" { return Tree.Return(e); }
  / "break"    __ _ l:Label      _ ";" { return Tree.Break(l); }
  / "debugger"                   _ ";" { return Tree.Debugger(); }
  /                 e:Expression _ ";" { return Tree.Lift(e); }

////////////////
// Expression //
////////////////

_ComaProperty = _ "," _ p:ComaPropertyBody { return p; }
ComaPropertyBody
  = "[" _ e1:Expression _ "]" _ ":" _ e2:Expression { return [e1, e2]; }
  /  s:String                 _ ":" _ e2:Expression { return [Tree.primitive(s), e2]; }
  /  i:IdentifierName         _ ":" _ e2:Expression { return [Tree.primitive(i), e2]; }

_ComaExpression = _ "," _ e:Expression { return e; }

_DotIdentifierName = _ "." _ s:IdentifierName { return s; }

_ApplyArguments = _ "(" _ x:ApplyArgumentsBody { return x }
ApplyArgumentsBody
  =                                           ")" { return (e1) => Tree.apply(e1, Tree.primitive(undefined), []); }
  / "@" _ e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.apply(e1, e2, es); }
  /       e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.apply(e1, Tree.primitive(undefined), [e2].concat(es)); }

NormalArguments = "(" _ es:NormalArgumentsBody { return es }
NormalArgumentsBody
  =                                    ")" { return [] }
  / e:Expression es:_ComaExpression* _ ")" { return [e].concat(es) }

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

EnclaveExpression
  = "super"  _ e:EnclaveSuper              { return e; }
  / "typeof" _ i:EnclaveIdentifier         { return Tree.enclave_typeof(i); }
  / "arguments"   __                       { return Tree.enclave_read("arguments"); }
  / "eval"        __                       { return Tree.enclave_read("eval"); }
  / "this"        __                       { return Tree.enclave_read("this"); }
  / "new.target"  __                       { return Tree.enclave_read("new.target"); }
  / "import.meta" __                       { return Tree.enclave_read("import.meta"); }
  / i:EnclaveIdentifier _ f:EnclaveAccess  { return f(i); }

EnclaveSuper
  = "["         _ e:Expression _ "]" { return Tree.enclave_super_member(e); }
  / "(" _ "..." _ e:Expression _ ")" { return Tree.enclave_super_call(e); }

EnclaveAccess
  = /* EnclaveStrictWrite */ "!=" _ e:Expression { return (i) => Tree.enclave_write(true, i, e); }
  / /* EnclaveNormalWrite */ "?=" _ e:Expression { return (i) => Tree.enclave_write(false, i, e); }
  / ""                                           { return (i) => Tree.enclave_read(i); }


Expression = e:NonApplyExpression fs:_ApplyArguments* { return fs.reduce((e, f) => f(e), e); }

NonApplyExpression
  = /* Import */             "import" __ _ e:ImportExpression                               { return e; }
  / /* Intrinsic */          "#" _ e:IntrinsicExpression                                    { return e; }
  / /* AsyncClosure */       "async" __ _ f:ClosureSort                                     { return f(true); }
  / /* NormalClosure */      f:ClosureSort                                                  { return f(false); }
  / /* Export */             "export" __ _ i:Specifier _ e:Expression                       { return Tree.export(i, e); }
  / /* Throw */              "throw" __ _ e:Expression                                      { return Tree.throw(e); }
  / /* enclave */            "enclave" __ _ e:EnclaveExpression                             { return e; }
  / /* Eval */               "eval" __ _ e:Expression                                       { return Tree.eval(e); }
  / /* yield */              "yield" __ _ e:YieldExpression                                 { return e; } 
   / /* await */             "await" __ _ e:Expression                                      { return Tree.await(e); }
  / /* Require */            "require" __ _ e:Expression                                    { return Tree.require(e); }
  / /* Construct */          "new" __ _ e:NonApplyExpression _ es:NormalArguments           { return Tree.construct(e, es); }
  / /* Object */             "{" _ "__proto__" _ ":" _ e:Expression ps:_ComaProperty* _ "}" { return Tree.object(e, ps); }
  / /* Head */               "(" _ e:Expression _ f:TailExpression                          { return f(e); }
  / /* Primitive */          "void" __ _ "0"                                                { return Tree.primitive(void 0); }
  / /* Primitive */          "null" __                                                      { return Tree.primitive(null); }
  / /* Primitive */          "false" __                                                     { return Tree.primitive(false); }
  / /* Primitive */          "true" __                                                      { return Tree.primitive(true); }
  / /* Primitive */          i:BigInt                                                       { return Tree.primitive(i); }
  / /* Primitive */          n:Number                                                       { return Tree.primitive(n); }
  / /* Primitive */          s:String                                                       { return Tree.primitive(s); }
  / /* Access */             i:Identifier _ f:AccessExpression                              { return f(i); }
  / /* Unary */              o:UnaryOperator _ e:Expression                                 { return Tree.unary(o, e); }

ClosureSort
  = "arrow"       _ f:ClosureGenerator { return f("arrow"); }
  / "function"    _ f:ClosureGenerator { return f("function"); }
  / "method"      _ f:ClosureGenerator { return f("method"); }
  / "constructor" _ f:ClosureGenerator { return f("constructor") }

ClosureGenerator
  = "*" _ f:ClosureBlock { return f(true) }
  /       f:ClosureBlock { return f(false) }

ClosureBlock
  = "(" _ ")" b:_Block { return (generator) => (sort) => (asynchronous) => Tree.closure(sort, asynchronous, generator, b); }

YieldExpression
  = "*" _ e:Expression { return Tree.yield(true, e) }
  /       e:Expression { return Tree.yield(false, e) }

IntrinsicExpression
  = s:String                                { return Tree.intrinsic(s); }
  / s:IdentifierName ss:_DotIdentifierName* { return Tree.intrinsic([s].concat(ss).join(".")); }

ImportExpression
  = "*"         _ "from" _ s:String { return Tree.import(null, s); }
  / i:Specifier _ "from" _ s:String { return Tree.import(i, s); }

AccessExpression
  = "=" _ e:Expression { return (i) => Tree.write(i, e); }
  / ""                 { return (i) => Tree.read(i); }

TailExpression
  =                                                          ")" { return (e) => e; }
  / ","              _ e2:Expression                       _ ")" { return (e1) => Tree.sequence(e1, e2); }
  / "?"              _ e2:Expression _ ":" _ e3:Expression _ ")" { return (e1) => Tree.conditional(e1, e2, e3); }
  / o:BinaryOperator _ e2:Expression                       _ ")" { return (e1) => Tree.binary(o, e1, e2); }
