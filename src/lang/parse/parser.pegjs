
{
  const {String:{fromCodePoint}, parseInt, parseFloat, BigInt, JSON:{stringify:stringifyJSON}} = globalThis;
  import {concat} from "array-lite";
  const appendMaybe = (array, maybe_element) => maybe_element === null ? array : concat(array, [maybe_element]);
  const identity = (arg) => arg;
  isKeyword
  isAranKeyword
  isUnaryOperator
  isBinaryOperator
  isEnclave
  import {
    makeScriptProgram,
    makeModuleProgram,
    makeEvalProgram,
    makeImportLink,
    makeExportLink,
    makeAggregateLink,
    makeBlock,
    makeExpressionStatement,
    makeReturnStatement,
    makeBreakStatement,
    makeDebuggerStatement,
    makeDeclareEnclaveStatement,
    makeBlockStatement,
    makeIfStatement,
    makeWhileStatement,
    makeTryStatement,
    makePrimitiveExpression,
    makeIntrinsicExpression,
    makeLoadImportExpression,
    makeReadExpression,
    makeReadEnclaveExpression,
    makeTypeofEnclaveExpression,
    makeClosureExpression,
    makeAwaitExpression,
    makeYieldExpression,
    makeSaveExportExpression,
    makeWriteExpression,
    makeWriteEnclaveExpression,
    makeSequenceExpression,
    makeConditionalExpression,
    makeThrowExpression,
    makeSetSuperEnclaveExpression,
    makeGetSuperEnclaveExpression,
    makeCallSuperEnclaveExpression,
    makeEvalExpression,
    makeImportExpression,
    makeApplyExpression,
    makeConstructExpression,
    makeUnaryExpression,
    makeBinaryExpression,
    makeObjectExpression,
  } from "../ast/index.mjs";
}

StartProgram = _ program:Program _ { return program; }

StartLink = _ link:Link _ { return link; }

StartBlock = block:_Block _ { return block; }

StartStatement = _ statement:Statement _ { return statement; }

StartExpression = _ expression:Expression _ { return expression; }

///////////////
// Primitive //
///////////////

// https://www.json.org/json-en.html

JSONString = $("\"" (JSONStringEscapeSequence / [^\"\\\u0000-\u001F])* "\"")

JSONStringEscapeSequence
  = "\\\""
  / "\\\\"
  / "\\\/"
  / "\\b"
  / "\\f"
  / "\\n"
  / "\\r"
  / "\\t"
  / "\\u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]

PositiveJSONNumber = $(("0" / [1-9][0-9]*) ("." [0-9]+)? ([eE] [+-]? [0-9]+)?)

String = JSONString

Source = String

Number = PositiveJSONNumber

BigInt = $(("0" / [1-9][0-9]*) "n")

////////////////
// Identifier //
////////////////

// https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Identifier
// https://javascript.info/regexp-unicode
// https://mathiasbynens.be/notes/javascript-identifiers

Identifier = head:$(IdentifierStart) tail:$(IdentifierPart*) { return head + tail; }

Intrinsic = intrinsic:[a-zA-Z.@]+ & { return isIntrinsic(intrinsic); } { return intrinsic; }

IdentifierStart = character:. & { return /\p{ID_Start}|\$|_/u.test(character); }

IdentifierPart = character:. & { return /\p{ID_Continue}|\$|\u200C|\u200D/u.test(character); }

Label = identifier:Identifier & { return !isLabel(identifier); } { return identifier; }

Variable = identifier:Identifier & { return !isVariable(identifier) } { return identifier; }

VariableKind = kind:$([a-z]+) & { return isVariableKind(kind); } { return kind; }

ClosureKind = kind:$([a-z]+) & { return isClosureKind(kind); } { return kind; }

Specifier = identifier:Identifier & { return isSpecifier(identifier) } { return identifier; }

EnclaveVariable = "enclave." identifier:Identifier & { return isEnclaveVariable(identifier); } { return identifier; }

WritableEnclaveVariableIdentifier = identifier:Identifier & { return isWritableEnclaveVariable(s); } { return identifier; }

ReadableEnclaveVariableIdentifier
  = "new.target" __ { return "new.target"; }
  / "import.meta" __ { return "import.meta"; }
  / identifier:Identifier & { return isReadableEnclaveVariable(identifier); } { return identifier; }

///////////
// Space //
///////////

__ = !IdentifierPart

Comment
  = "/*" (!"*/" .)* "*/"
  / "//" [^\n]*

_ = ([ \n\t] / Comment)*

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
  / operator:$(OperatorCharacter) & { return isUnaryOperator(operator); } { return operator; }

BinaryOperator
  = "in"         __ { return "in"; }
  / "instanceof" __ { return "instanceof"; }
  / operator:$(OperatorCharacter+) & { return isBinaryOperator(operator); } { return operator; }

/////////////
// Enclave //
/////////////

Enclave = enclave:$([a-z.()]+) & { return isEnclave(enclave); } { return enclave; }

/////////////
// Program //
/////////////

_EnclaveSemicolon = _ enclave:Enclave _ ";" { return e }

Program
  = "script;" block:_Block { return makeScriptProgram(block); }
  / "module;" _ "{" links:_LinkSemicolon* _ "}" block:_Block { return makeModuleProgram(links, block); }
  / "eval;" _ "{" enclaves:_EnclaveSemicolon* _ "}" _ "{" variables:_VariableSemicolon* _ "}" block:_Block { return makeEvalProgram(enclaves, variables, block); }

//////////
// Link //
//////////

_LinkSemicolon = _ link:Link { return link; };

Link
  = "import" _ link:ImportLink { return link; }
  / "export" _ link:ExportLink { return link; }

ImportLink
  = "*" _ "from" _ source:Source { return makeImportLink(null, source); }
  / specifier:Specifier _ "from" _ source:Source { return makeImportLink(specifier, source); }

ExportLink
  = "*" _ link:AllExportLink { return link; }
  / specifier:Specifier _ makeLink:SpecifierExportLink { return makeLink(specifier); }

AllExportLink
  = "from" _ source:Source _ ";" { return makeAggregateLink(null, null, source); }
  / "as" _ specifier:Specifier _ "from" _ source:Source _ ";" { return makeAggregateLink(null, specifier, source); }

SpecifierExportLink
  = "as" _ specifier2:Specifier _ "from" _ source:Source _ ";" { return (specifier1) => makeAggregateLink(specifier1, specifier2, source); }
  / ";" { return makeExportLink; }

///////////
// Block //
///////////

_Block = labels:_LabelColon* _ "{" _ variables:Declaration statements:_Statement* _ "}" { return makeBlock(labels, variables, statements); }

_LabelColon = _ label:Label _ ":" { return label; }

Declaration
  = "let" __ variables:_VariableComa* _ maybe_variable:Variable? _ ";" { return appendMaybe(variables, maybe_variable); }
  / "" { return [] }

_VariableComa = _ variable:Variable _ "," { return variable; }

///////////////
// Statement //
///////////////

_Statement = _ statement:Statement { return statement; }

Statement
  = "if" _ & "(" _ expression:Expression block1:_Block _ "else" block2:Block { return makeIfStatement(expression, block1, block2); }
  / "while" _ & "(" _ expression:Expression block:_Block { return makeWhileStatement(expression, block); }
  / "try" block1:_Block _ "catch" block2:_Block _ "finally" block3:_Block { return makeTryStatement(block1, block2, block3); }
  / block:_Block { return makeBlockStatement(block); }
  / "enclave" __ _ kind:VariableKind _ variable:WritableEnclaveVariable _ "=" _ expression:Expression _ ";" { return makeDeclareEnclaveStatement(kind, variable, expression); }
  / "return" __ _ expression:Expression _ ";" { return makeReturnStatement(expression); }
  / "break" __ _ label:Label _ ";" { return makeBreakStatement(label); }
  / "debugger" _ ";" { return makeDebuggerStatement(); }
  / effect:Effect _ ";" { return makeExpressionStatement(effect); }

////////////
// Effect //
////////////

Effect
  = "export" __ _ specifier:Specifier _ "=" _ expression:Expression { return makeExportEffect(specifier, expression); }
  / "drop" __ _ expression:Expression { return makeExpressionEffect(expression); }
  / "write" __ _ effect:WriteEffect { return effect; }

WriteEffect
  = "enclave.super" _ "[" _ expression1:Expression _ "]" _ "=" _ expression2:Expression { return makeSetSuperEffect(expression1, expression2); }
  / variable:EnclaveVariable _ "=" _ expression:Expression { return makeWriteEnclaveEffect(variable, expression); }
  / variable:Variable _ "=" _ expression:Variable { return makeWriteEffect(variable, expression); }

////////////////
// Expression //
////////////////

Property
  = "[" _ expression1:Expression _ "]" _ ":" _ expression2:Expression { return [expression1, expression2]; }
  / identifier:Identifier _ ":" _ expression:Expression { return [makePrimitiveExpression(stringifyJSON(identifier)), expression]; }

_PropertyComa = _ property:Property _ "," { return property; }

Property_ = property:Property _ { return property; }

_ExpressionComa
  = _ expression:Expression _ "," { return expression; }

_ApplyArguments
  = _ "(" _ x:ApplyArgumentsBody { return x }

ApplyArgumentsBody
  =                                           ")" { return (e1) => Tree.ApplyExpression(e1, Tree.PrimitiveExpression(undefined), []); }
  / "@" _ e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.ApplyExpression(e1, e2, es); }
  /       e2:Expression es:_ComaExpression* _ ")" { return (e1) => Tree.ApplyExpression(e1, Tree.PrimitiveExpression(undefined), concatenate([e2], es)); }

ConstructArguments
  = "(" _ es:ConstructArgumentsBody { return es; }

ConstructArgumentsBody
  =                                    ")" { return []; }
  / e:Expression es:_ComaExpression* _ ")" { return concatenate([e], es); }

EnclaveExpression
  = "super" __ _ expression:SuperEnclaveExpression { return expression; }
  / "typeof" __ _ variable:EnclaveVariable { return makeTypeofEnclaveExpression(variable); }
  / variable:EnclaveVariable { return makeReadEnclaveExpression(variable); }

EnclaveParenthesisExpression
  / "super" expression:SuperEnclaveParenthesisExpression { return expression; }
  / "typeof" __ _ variable:EnclaveVariable _ ")" { return makeTypeofEnclaveExpression(variable); }
  / variable:EnclaveVariable _ makeExpression:WriteEnclaveParenthesisExpressionTail { return makeExpression(variable); }

SuperEnclaveParenthesisExpression
  = "[" _ expression:Expression _ "]" _ makeExpression:SuperEnclaveParenthesisExpressionTail { return makeExpression(expression); }
  / "(" _ "..." _ expression:Expression _ ")" _ ")" { return makeCallSuperEnclaveExpression(expression); }

SuperEnclaveParenthesisExpressionTail
  = "=" _ expression2:Expression "," _ expression3:Expression _ ")" { return (expression1) => makeSetSuperEnclaveExpression(expression1, expression2, expression3); }
  / ")" { return makeGetSuperEnclaveExpression; }

WriteEnclaveParenthesisExpressionTail
  = "=" _ expression1:Expression "," _ expression2:Expression _ ")" { return (variable) => makeWriteEnclaveExpression(variable, expression1, expression2); }
  / ")" { return makeReadEnclaveExpression; }

SuperEnclaveExpression
  = "["         _ expression:Expression _ "]" { return makeGetSuperEnclaveExpression(expression); }
  / "(" _ "..." _ expression:Expression _ ")" { return makeCallSuperEnclaveExpression(expression); }

Expression
  = e:NonApplyExpression fs:_ApplyArguments* { return fs.reduce((e, f) => f(e), e); }

NonApplyExpression
  = "import" __ _ expression:ImportExpression { return expression; }
  / "#" _ intrinsic:Intrinsic { return makeIntrinsicExpression(intrinsic); }
  / asynchronous:$("async" _)? kind:ClosureKind _ generator:$("*" _ )? "(" _ ")" block:Block { return makeClosureExpression(kind, asynchronous !== null, generator !== null, block); }
  / "throw" __ _ expression:Expression { return makeThrowExpression(e); }
  / "typeof" __ _ expression:TypeofExprssion { return expression; }
  / "enclave" __ _ expression:EnclaveExpression { return expression; }
  / "eval" _ "(" enclaves:_EnclaveComa* _ maybe_enclave:Enclave_? ")" "(" variables:_VariableComa* _ maybe_variable:Variable_? ")" _ "(" _ expression:Expression _ ")" { return makeEvalExpression(appendMaybe(enclaves, maybe_enclave), appendMaybe(variables, maybe_variable), expression); }
  / "yield" __ _ delegate:("*" _)? expression:Expression { return makeYieldExpression(delegate !== null, expression); } 
  / "await" __ _ expression:Expression { return makeAwaitExpression(expression); }
  /"new" __ _ expression:NonApplyExpression _ expressions:ConstructArguments { return makeConstructExpression(expression, expressions); }
  / "{" _ "__proto__" _ ":" _ expression:Expression properties:_PropertyComa* _ maybe_property:Property_? "}" { return makeObjectExpression(expression, appendMaybe(properties, maybe_property); }
  / "(" _ expression:ParenthesisExpression { return expression; }
  / raw:$(Primitive) { return makePrimitiveExpression(raw); }
  / operator:UnaryOperator _ expression:Expression { return makeUnaryExpression(operator, expression); }
  / variable:Variable { return makeReadExpression(variable); }

ParenthesisExpression
  = "export" _ specifier:Specifier _ "=" expression1:Expression _ "," _ expression2:Expression _ ")" { return makeExportExpression(specifier, expression1, expression2); }
  / "enclave" _ expression:EnclaveParenthesisExpression { return expression; }
  / variable:Variable _ makeExpression:WriteParenthesisExpressionTail { return makeExpression(variable); }
  / expression:Expression _ makeExpression:ParenthesisExpressionTail { return makeExpression(expression); }

WriteParenthesisExpressionTail
  = "=" _ expression1:Expression _ "," _ expression2:Expression _ ")" { return (variable) => makeWriteExpression(variable, expression1, expression2); }
  / makeExpression:ParenthesisExpressionTail { return (variable) => makeExpression(makeReadExpression(variable)); }

ParenthesisExpressionTail
  = operator:BinaryOperator _ expression2:Expression _ ")" { return (expression1) => makeBinary(expression1, expression2); }
  / "," _ expression2:Expression _ ")" { return (expression1) => makeSequenceExpression(expression1, expression2); }
  / "?" _ expression2:Expression _ ":" _ expression3:Expression _ ")" { return (expression1) => makeConditionalExpression(expression1, expression1, expression2); }
  / ")" { return identity; }

ImportExpression
  = & "(" _ expression:Expression { return makeDynamicImportExpression(expression); }
  / "*" _ "from" _ source:Source { return makeImportExpression(null, source); }
  / specifier:Specifier _ "from" _ source:Source { return makeImportExpression(specifier, source); }

Primitive
  = "undefined"
  / "null"
  / "true"
  / "false"
  / Number
  / String
  / BigInt
