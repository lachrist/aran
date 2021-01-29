
{
  const Tree = require("../../tree.js");
}

StartProgram = _ p:Program _ { return p; }

StartLink = _ p:Link _ { return p; }

StartBlock = _ b:Block _ { return b; }

StartBranch = b:_Branch _ { return b; }

StartSingleStatement = _ s:SingleStatement _ { return s; }

StartExpression = _ e:Expression _ { return e; }

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
  / "\\u" s:$([0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) { return String.fromCodePoint(parseInt(s, 16)); }

JSONNumber
  = s1:$("-"? ("0" / [1-9][0-9]*)) s2:$(("." [0-9]+)?) s3:$(([eE] [+-]? [0-9]+)?) { return (s2 === "" && s3 === "") ? parseInt(s1, 10) : parseFloat(s1 + s2 + s3, 10); }

////////////////
// ECMAScript //
////////////////

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Identifier
// https://javascript.info/regexp-unicode
// https://mathiasbynens.be/notes/javascript-identifiers

Identifier = s:IdentifierStart ss:IdentifierPart* { return s + ss.join(""); }

IdentifierStart = s:. & { return /\p{ID_Start}|\$|_/u.test(s); } { return s; }

IdentifierPart = s:. & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(s); } { return s; }

/////////////
// Helpers //
/////////////

__ = !IdentifierPart

Comment
  = "/*" (!"*/" .)* "*/"
  / "//" [^\n]*

_ = ([ \n\t] / Comment)*

String = JSONString

Number = JSONNumber

BigInt = s:$([0-9]+) "n" { return BigInt(s); }

LabelIdentifier
  = s:Identifier & { return !Tree.isKeyword(s) && !Tree.isAranKeyword(s); } { return s; }

VariableIdentifier
  = s:Identifier & { return !Tree.isKeyword(s) && !Tree.isAranKeyword(s); } { return s; }

ReadableEnclaveVariableIdentifier
  = "new.target" __ { return "new.target"; }
  / "import.meta" __ { return "import.meta"; }
  / s:Identifier & { return s === "this" || s === "eval" || s === "arguments" || !Tree.isKeyword(s); } { return s; }

WritableEnclaveVariableIdentifier
  = s:Identifier & { return !Tree.isKeyword(s); } { return s; }

Specifier
  = Identifier

//////////////
// Operator //
//////////////

OperatorCharacter
  = "+"
  / "-"
  / "~"
  / "!"
  / "*"
  / "/"
  / "="
  / "<"
  / ">"
  / "|"
  / "&"
  / "^"
  / "%"

UnaryOperator
  = "typeof" __ { return "typeof"; }
  / "void" __ { return "void"; }
  / s:OperatorCharacter & { return Tree.isUnaryOperator(s); } { return s; }

BinaryOperator
  = "in"         __ { return "in"; }
  / "instanceof" __ { return "instanceof"; }
  / ss:OperatorCharacter+ & { return Tree.isBinaryOperator(ss.join("")); } { return ss.join(""); }

/////////////
// Program //
/////////////

Program
  = "script"                                _ ";" _ b:Block { return Tree.ScriptProgram(b); }
  / "eval" is:_ParagraphVariableIdentifier* _ ";" _ b:Block { return Tree.EvalProgram(is, b); }
  / "module" _ ";" ls:_Link*                      _ b:Block { return Tree.ModuleProgram(ls, b); }

//////////
// Link //
//////////

_Link
  = _ l:Link { return l; };

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

////////////
// Branch //
////////////

_Branch = is:_ColonLabelIdentifier* _ b:Block { return Tree.Branch(is, b) }

_ColonLabelIdentifier = _ i:LabelIdentifier _ ":" _ { return i; }

///////////
// Block //
///////////

Block = "{" _ is:Declaration ss:(_SingleStatement*) _ "}" { return Tree.Block(is, ss.length === 1 ? ss[0] : Tree.ListStatement(ss)); }

Declaration
  = "let" __ _ i:VariableIdentifier is:_ComaVariableIdentifier* _ ";" { return [i].concat(is); }
  / "" { return [] }

_ComaVariableIdentifier = _ "," _ s:VariableIdentifier { return s; }

///////////////
// Statement //
///////////////

_SingleStatement
  = _ s:SingleStatement { return s; }

SingleStatement
  = "if"    _ & "(" _ e:Expression b1:_Branch _ "else"  b2:_Branch                        { return Tree.IfStatement(e, b1, b2); }
  / "while" _ & "(" _ e:Expression b: _Branch                                             { return Tree.WhileStatement(e, b); }
  / "try"                          b1:_Branch _ "catch" b2:_Branch _ "finally" b3:_Branch { return Tree.TryStatement(b1, b2, b3); }
  /                                b: _Branch                                             { return Tree.BranchStatement(b); }
  / "enclave"  __ _ k:Kind _ i:WritableEnclaveVariableIdentifier _ "=" _ e:Expression _ ";" { return Tree.DeclareEnclaveStatement(k, i, e) }
  / "completion" __ _ e:Expression      _ ";" { return Tree.CompletionStatement(e); }
  / "return"     __ _ e:Expression      _ ";" { return Tree.ReturnStatement(e); }
  / "break"      __ _ i:LabelIdentifier _ ";" { return Tree.BreakStatement(i); }
  / "debugger"                          _ ";" { return Tree.DebuggerStatement(); }
  /            e:Expression             _ ";" { return Tree.ExpressionStatement(e); }

Kind
  = "var"
  / "let"
  / "const"

////////////////
// Expression //
////////////////

_ComaProperty
  = _ "," _ p:ComaPropertyBody { return p; }

ComaPropertyBody
  = "[" _ e1:Expression _ "]" _ ":" _ e2:Expression { return [e1, e2]; }
  / s:String                  _ ":" _ e2:Expression { return [Tree.PrimitiveExpression(s), e2]; }
  / i:Identifier              _ ":" _ e2:Expression { return [Tree.PrimitiveExpression(i), e2]; }

_ComaExpression
  = _ "," _ e:Expression { return e; }

_ApplyArguments
  = _ "(" _ x:ApplyArgumentsBody { return x }

ApplyArgumentsBody
  =                                           ")" { return (e1) => Tree.ApplyExpression(e1, Tree.PrimitiveExpression(undefined), []); }
  / "@" _ e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.ApplyExpression(e1, e2, es); }
  /       e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.ApplyExpression(e1, Tree.PrimitiveExpression(undefined), [e2].concat(es)); }

NormalArguments
  = "(" _ es:NormalArgumentsBody { return es; }

NormalArgumentsBody
  =                                    ")" { return []; }
  / e:Expression es:_ComaExpression* _ ")" { return [e].concat(es); }

EnclaveExpression
  = "super" __ _ e:SuperEnclaveExpression { return e; }
  / "typeof" __ _ i:ReadableEnclaveVariableIdentifier { return Tree.TypeofEnclaveExpression(i); }
  / i:WritableEnclaveVariableIdentifier _ b:WriteEnclaveOperator _ e:Expression { return Tree.WriteEnclaveExpression(b, i, e); }
  / i:ReadableEnclaveVariableIdentifier { return Tree.ReadEnclaveExpression(i) }

WriteEnclaveOperator
  = "?=" { return false; }
  / "!=" { return true; }

SuperEnclaveExpression
  = "["         _ e:Expression _ "]" { return Tree.MemberSuperEnclaveExpression(e); }
  / "(" _ "..." _ e:Expression _ ")" { return Tree.CallSuperEnclaveExpression(e); }

Expression
  = e:NonApplyExpression fs:_ApplyArguments* { return fs.reduce((e, f) => f(e), e); }

NonApplyExpression
  = /* Import */             "import" __ _ e:ImportExpression                               { return e; }
  / /* Export */             "export" __ _ i:Specifier _ e:Expression                       { return Tree.ExportExpression(i, e); }
  / /* Intrinsic */          "#" _ i:Identifier ss:_IntrinsicPart*                          { return Tree.IntrinsicExpression(i + ss.join("")); }
  / /* AsyncClosure */       "async" __ _ f:ClosureSort                                     { return f(true); }
  / /* NormalClosure */      f:ClosureSort                                                  { return f(false); }
  / /* Throw */              "throw" __ _ e:Expression                                      { return Tree.ThrowExpression(e); }
  / /* enclave */            "enclave" __ _ e:EnclaveExpression                             { return e; }
  / /* Eval */               "eval" __ is:_ParagraphVariableIdentifier* _ e:Expression      { return Tree.EvalExpression(is, e); }
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
  / /* Access */             i:VariableIdentifier _ f:AccessExpression                      { return f(i); }
  / /* Unary */              o:UnaryOperator _ e:Expression                                 { return Tree.UnaryExpression(o, e); }

_ParagraphVariableIdentifier
 = _ "§" _ i:VariableIdentifier { return i; }

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

_IntrinsicPart
  = _ s:IntrinsicPart { return s; }

IntrinsicPart
  = "." _ i:Identifier { return "." + i; }
  / "@" _ s:IntrinsicAccessor { return "@" + s; }

IntrinsicAccessor
  = "get"
  / "set"

ImportExpression
  = "*"         _ "from" _ s:String { return Tree.ImportExpression(null, s); }
  / i:Specifier _ "from" _ s:String { return Tree.ImportExpression(i, s); }

AccessExpression
  = "=" _ e:Expression { return (i) => Tree.WriteExpression(i, e); }
  / "" { return (i) => Tree.ReadExpression(i); }

TailExpression
  =                                                          ")" { return (e) => e; }
  / ","              _ e2:Expression                       _ ")" { return (e1) => Tree.SequenceExpression(e1, e2); }
  / "?"              _ e2:Expression _ ":" _ e3:Expression _ ")" { return (e1) => Tree.ConditionalExpression(e1, e2, e3); }
  / o:BinaryOperator _ e2:Expression                       _ ")" { return (e1) => Tree.BinaryExpression(o, e1, e2); }
