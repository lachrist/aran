
// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-ReservedWord

{
  const Tree = require("../../tree.js");
}

StartProgram = _ p:Program _ { return p; }

StartLink = _ p:Link _ { return p; }

StartBlock = _ b:Block _ { return b; }

StartLabelBlock = _ lb:LabelBlock _ { return lb; }

StartStatement = ss:_Statement* _ { return ss.length === 1 ? ss[0] : Tree.BundleStatement(ss); }

StartExpression = _ e:Expression _ { return e; }

/////////////
// Unicode //
/////////////

UnicodeEscapeSequence
  = UnicodeFixedEscapeSequence
  / UnicodeFlexibleEscapeSequence

UnicodeFixedEscapeSequence
  = "\\u" s:$([0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) { return String.fromCodePoint(parseInt(s, 16)); }

UnicodeFlexibleEscapeSequence
  = "\\u{" s:$([0-9a-fA-F]+) & { return parseInt(s, 16) <= 0x10FFFF } "}" { return String.fromCodePoint(parseInt(s, 16)); }

//////////
// JSON //
//////////

// https://www.json.org/json-en.html

JSONString
  = "\"" ss:(JSONStringEscapeSequence / [^\"\\\u0000-\u001F])* "\"" { return ss.join(""); }

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
  = s1:$("-"? ("0" / [1-9][0-9]*)) s2:$(("." [0-9]+)?) s3:$(([eE] [+-]? [0-9]+)?) { return (s2 === "" && s3 === "") ? parseInt(s1, 10) : parseFloat(s1 + s2 + s3, 10); }

////////////////
// ECMAScript //
////////////////

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Identifier
// https://javascript.info/regexp-unicode
// https://mathiasbynens.be/notes/javascript-identifiers

IdentifierName = s:IdentifierStart ss:IdentifierPart* { return s + ss.join(""); }

IdentifierStart = s:. & { return /\p{ID_Start}|\$|_/u.test(s); } { return s; }

IdentifierPart = s:. & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(s); } { return s; }

/////////////
// Helpers //
/////////////

Label
  = s:IdentifierName & { return !Tree.isKeyword(s) && !Tree.isAranKeyword(s); } { return s; }

Identifier
  = s:IdentifierName & { return !Tree.isKeyword(s) && !Tree.isAranKeyword(s); } { return s; }

ReadEnclaveIdentifier
  = "new.target" { return "new.target"; }
  / "import.meta" { return "import.meta"; }
  / s:IdentifierName & { return s === "this" || s === "eval" || s === "arguments" || !Tree.isKeyword(s); } { return s; }

WriteEnclaveIdentifier
  = s:IdentifierName & { return !Tree.isKeyword(s); } { return s; }

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

Program = ls:Link_* _ b:Block { return Tree.Program(ls, b) }

//////////
// Link //
//////////

Link_ = l:Link _ { return l; };

Link
  = "import" _ l:ImportLink { return l; }
  / "export" _ c:Specifier _ ";" { return Tree.ExportLink(c); }
  / "aggregate" _ l:AggregateLink { return l; }

ImportLink
  = "*" _ "from" _ s:Source _ ";" { return Tree.ImportLink(null, s); }
  / c:Specifier _ "from" _ s:Source _ ";" { return Tree.ImportLink(c, s); }

AggregateLink
  = "*" _ "from" _ s:Source _ ";" { return Tree.AggregateLink(null, s, null); }
  / c1:Specifier _ "from" _ s:Source _ "as" _ c2:Specifier _ ";" { return Tree.AggregateLink(c1, s, c2); }

Source = String

////////////////
// LabelBlock //
////////////////

LabelBlock = ls:ColonLabel_* _ b:Block { return Tree.LabelBlock(ls, b) }

ColonLabel_ = l:Label _ ":" _ { return l }

///////////
// Block //
///////////

Block = "{" _ is:Declaration ss:(_Statement*) _ "completion" __ _ e:Expression _ ";" _ "}" { return Tree.Block(is, ss, e); }

Declaration
  = "let" __ _ i:Identifier _ is:ComaIdentifier_* ";" { return [i].concat(is); }
  / "" { return [] }

ComaIdentifier_ = "," _ s:Identifier _ { return s; }

///////////////
// Statement //
///////////////

_Statement = _ s:Statement { return s }

Statement
  = "if"    _ & "(" _ e:Expression _ lb1:LabelBlock _ "else"  _ lb2:LabelBlock                              { return Tree.IfStatement(e, lb1, lb2); }
  / "while" _ & "(" _ e:Expression _ lb: LabelBlock                                                         { return Tree.WhileStatement(e, lb); }
  / "try"                          _ lb1:LabelBlock _ "catch" _ lb2:LabelBlock _ "finally" _ lb3:LabelBlock { return Tree.TryStatement(lb1, lb2, lb3); }
  /                                _ lb: LabelBlock                                                         { return Tree.BlockStatement(lb); }
  / "enclave"  __ _ k:Kind _ i:WriteEnclaveIdentifier _ "=" _ e:Expression _ ";" { return Tree.DeclareEnclaveStatement(k, i, e) }
  / "return"   __ _ e:Expression _ ";" { return Tree.ReturnStatement(e); }
  / "break"    __ _ l:Label      _ ";" { return Tree.BreakStatement(l); }
  / "debugger"                   _ ";" { return Tree.DebuggerStatement(); }
  /                 e:Expression _ ";" { return Tree.ExpressionStatement(e); }

Kind
  = "var"
  / "let"
  / "const"

////////////////
// Expression //
////////////////

_ComaProperty = _ "," _ p:ComaPropertyBody { return p; }
ComaPropertyBody
  = "[" _ e1:Expression _ "]" _ ":" _ e2:Expression { return [e1, e2]; }
  /  s:String                 _ ":" _ e2:Expression { return [Tree.PrimitiveExpression(s), e2]; }
  /  i:IdentifierName         _ ":" _ e2:Expression { return [Tree.PrimitiveExpression(i), e2]; }

_ComaExpression = _ "," _ e:Expression { return e; }

_DotIdentifierName = _ "." _ s:IdentifierName { return s; }

_ApplyArguments = _ "(" _ x:ApplyArgumentsBody { return x }
ApplyArgumentsBody
  =                                           ")" { return (e1) => Tree.ApplyExpression(e1, Tree.PrimitiveExpression(undefined), []); }
  / "@" _ e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.ApplyExpression(e1, e2, es); }
  /       e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.ApplyExpression(e1, Tree.PrimitiveExpression(undefined), [e2].concat(es)); }

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
  = "super"  _ e:EnclaveSuper { return e; }
  / "typeof" _ i:ReadEnclaveIdentifier { return Tree.TypeofEnclaveExpression(i); }
  / i:WriteEnclaveIdentifier _ b:EnclaveWriteStrict _ e:Expression { return Tree.WriteEnclaveExpression(b, i, e); }
  / i:ReadEnclaveIdentifier { return Tree.ReadEnclaveExpression(i) }

EnclaveWriteStrict
  = "?=" { return false; }
  / "!=" { return true; }

EnclaveSuper
  = "["         _ e:Expression _ "]" { return Tree.SuperMemberEnclaveExpression(e); }
  / "(" _ "..." _ e:Expression _ ")" { return Tree.SuperCallEnclaveExpression(e); }

Expression = e:NonApplyExpression fs:_ApplyArguments* { return fs.reduce((e, f) => f(e), e); }

NonApplyExpression
  = /* Import */             "import" __ _ e:ImportExpression                               { return e; }
  / /* Intrinsic */          "#" _ e:IntrinsicExpression                                    { return e; }
  / /* AsyncClosure */       "async" __ _ f:ClosureSort                                     { return f(true); }
  / /* NormalClosure */      f:ClosureSort                                                  { return f(false); }
  / /* Export */             "export" __ _ i:Specifier _ e:Expression                       { return Tree.ExportExpression(i, e); }
  / /* Throw */              "throw" __ _ e:Expression                                      { return Tree.ThrowExpression(e); }
  / /* enclave */            "enclave" __ _ e:EnclaveExpression                             { return e; }
  / /* Eval */               "eval" __ _ e:Expression                                       { return Tree.EvalExpression(e); }
  / /* yield */              "yield" __ _ e:YieldExpression                                 { return e; } 
  / /* await */              "await" __ _ e:Expression                                      { return Tree.AwaitExpression(e); }
  / /* Require */            "require" __ _ e:Expression                                    { return Tree.RequireExpression(e); }
  / /* Construct */          "new" __ _ e:NonApplyExpression _ es:NormalArguments           { return Tree.ConstructExpression(e, es); }
  / /* Object */             "{" _ "__proto__" _ ":" _ e:Expression ps:_ComaProperty* _ "}" { return Tree.ObjectExpression(e, ps); }
  / /* Head */               "(" _ e:Expression _ f:TailExpression                          { return f(e); }
  / /* Primitive */          "void" __ _ "0"                                                { return Tree.PrimitiveExpression(void 0); }
  / /* Primitive */          "null" __                                                      { return Tree.PrimitiveExpression(null); }
  / /* Primitive */          "false" __                                                     { return Tree.PrimitiveExpression(false); }
  / /* Primitive */          "true" __                                                      { return Tree.PrimitiveExpression(true); }
  / /* Primitive */          i:BigInt                                                       { return Tree.PrimitiveExpression(i); }
  / /* Primitive */          n:Number                                                       { return Tree.PrimitiveExpression(n); }
  / /* Primitive */          s:String                                                       { return Tree.PrimitiveExpression(s); }
  / /* Access */             i:Identifier _ f:AccessExpression                              { return f(i); }
  / /* Unary */              o:UnaryOperator _ e:Expression                                 { return Tree.UnaryExpression(o, e); }

ClosureSort
  = "arrow"       _ f:ClosureGenerator { return f("arrow"); }
  / "function"    _ f:ClosureGenerator { return f("function"); }
  / "method"      _ f:ClosureGenerator { return f("method"); }
  / "constructor" _ f:ClosureGenerator { return f("constructor") }

ClosureGenerator
  = "*" _ f:ClosureBlock { return f(true) }
  /       f:ClosureBlock { return f(false) }

ClosureBlock
  = "(" _ ")" _ b:Block { return (generator) => (sort) => (asynchronous) => Tree.ClosureExpression(sort, asynchronous, generator, b); }

YieldExpression
  = "*" _ e:Expression { return Tree.YieldExpression(true, e) }
  /       e:Expression { return Tree.YieldExpression(false, e) }

IntrinsicExpression
  = s:String                                { return Tree.IntrinsicExpression(s); }
  / s:IdentifierName ss:_DotIdentifierName* { return Tree.IntrinsicExpression([s].concat(ss).join(".")); }

ImportExpression
  = "*"         _ "from" _ s:String { return Tree.ImportExpression(null, s); }
  / i:Specifier _ "from" _ s:String { return Tree.ImportExpression(i, s); }

AccessExpression
  = "=" _ e:Expression { return (i) => Tree.WriteExpression(i, e); }
  / ""                 { return (i) => Tree.ReadExpression(i); }

TailExpression
  =                                                          ")" { return (e) => e; }
  / ","              _ e2:Expression                       _ ")" { return (e1) => Tree.SequenceExpression(e1, e2); }
  / "?"              _ e2:Expression _ ":" _ e3:Expression _ ")" { return (e1) => Tree.ConditionalExpression(e1, e2, e3); }
  / o:BinaryOperator _ e2:Expression                       _ ")" { return (e1) => Tree.BinaryExpression(o, e1, e2); }
