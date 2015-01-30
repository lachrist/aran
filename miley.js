
/////////////
// Helpers //
/////////////

// Helper for left-hand-side expression used in:
//   ForInStatement
//   AssignmentExpression
//   UpdateExpression
//   UnaryExpression (delete)
//
// [is_identifier, name]
//
// ID             >>> ["ID", null]
// <expr>.ID      >>> [null, "ID"]
// <expr>[<expr>] >>> [null, null]
function left (node, exprs) {
  if (node.type === "Identifier") { return [node.name, null] }
  if (node.type !== "MemberExpression") { throw new Error(node) }
  exprs.push(node.object)
  if (node.computed) {
    exprs.push(node.property)
    return [null, null]
  }
  if (node.property.type !== "Identifier") { throw new Error(node) }
  return [null, node.property.name]
}

// Helper for variable declarations used in:
//   VariableDeclaration
//   ForStatement
//
// [[name,initialized]]
//
// var ID;              >>> [["ID",false]]
// var ID=<expr>;       >>> [["ID",true]]
// var ID1, ID2=<expr>; >>> [["ID1",false],["ID2",true]]
// etc...
function declaration (node, exprs) {
  var declarations = []
  node.declarations.forEach(function (d) {
    declarations.push([d.id.name,Boolean(d.init)])
    if (d.init) { exprs.push(d.init) }
  })
  return declarations
}

/////////////
// Exports //
/////////////

// interface Program <: Node {
//   type: "Program";
//   body: [ Statement ];
// }
// 
// [program_length]
//
//              >>> []
// <stmt>       >>> [1]
// <stmt><stmt> >>> [2]
exports.Program = function (node) {
  return { stmts:node.body.slice(), exprs:[], infos:[node.body.length] }
}


// interface EmptyStatement <: Statement {
//   type: "EmptyStatement";
// }
//
// []
//
// ; >>> []
exports.EmptyStatement = function (node) {
  return { stmts:[], exprs:[], infos:[] }
}


// interface BlockStatement <: Statement {
//   type: "BlockStatement";
//   body: [ Statement ];
// }
//
// [body_length]
//
// {}             >>> [0]
// {<stmt>}       >>> [1]
// {<stmt><stmt>} >>> [2]
// etc...
exports.BlockStatement = function (node) {
  return { stmts:node.body.slice(), exprs:[], infos:[node.body.length] }
}


// interface ExpressionStatement <: Statement {
//   type: "ExpressionStatement";
//   expression: Expression;
// }
//
// []
//
// <expr>; >>> []
exports.ExpressionStatement = function (node) {
  return { stmts:[], exprs:[node.expression], infos:[] }
}


// interface IfStatement <: Statement {
//   type: "IfStatement";
//   test: Expression;
//   consequent: Statement;
//   alternate: Statement | null;
// }
//
// [has_alternate]
//
// if (<expr>) <stmt>             >>> [false]
// if (<expr>) <stmt> else <stmt> >>> [true]
exports.IfStatement = function (node) {
  var stmts = [node.consequent]
  var alt = Boolean(node.alternate)
  if (alt) { stmts.push(node.alternate) }
  return { stmts:stmts, exprs:[node.test], infos:[alt] }
}


// interface LabeledStatement <: Statement {
//   type: "LabeledStatement";
//   label: Identifier;
//   body: Statement;
// }
//
// [label]
//
// ID:<stmt> >>> ["ID"]
exports.LabeledStatement = function (node) {
  return { stmts:[node.body], exprs:[], infos:[node.label.name] }
}


// interface BreakStatement <: Statement {
//   type: "BreakStatement";
//   label: Identifier | null;
// }
//
// [label]
//
// break;    >>> [null]
// break ID; >>> ["ID"]
exports.BreakStatement = function (node) {
  return { stmts:[], exprs:[], infos:[node.label?node.label.name:null] }
}


// interface ContinueStatement <: Statement {
//   type: "ContinueStatement";
//   label: Identifier | null;
// }
//
// [label]
//
// continue;    >>> [null]
// continue ID; >>> ["ID"]
exports.ContinueStatement = function (node) {
  return { stmts:[], exprs:[], infos:[label?label.name:null] }
}

// interface WithStatement <: Statement {
//   type: "WithStatement";
//   object: Expression;
//   body: Statement;
// }
//
// []
//
// with (<expr>) <stmt> >>> []
exports.WithStatement = function (node) {
  return { stmts:[node.body], exprs:[node.object], infos:[] }
}


// interface SwitchStatement <: Statement {
//   type: "SwitchStatement";
//   discriminant: Expression;
//   cases: [ SwitchCase ];
//  *lexical: boolean;
// }
// interface SwitchCase <: Node {
//   type: "SwitchCase";
//   test: Expression | null;
//   consequent: [ Statement ];
// }
//
// [[has_test, consequent_lengths]]
//
// TODO update examples
// switch (<expr>) {}                                 >>> [[], []]
// switch (<expr>) {case<expr>:}                      >>> [[true], [0]]
// switch (<expr>) {case<expr>:<stmt>}                >>> [[true], [1]]
// switch (<expr>) {case<expr>:<stmt><stmt>}          >>> [[true], [2]]
// switch (<expr>) {case<expr>: case<expr>:<stmt>}    >>> [[true,true], [0,1]]
// switch (<expr>) {default:}                         >>> [[false], [0]]
// switch (<expr>) {default:<stmt>}                   >>> [[false], [1]]
// switch (<expr>) {case<expr>: case<expr>: default:} >>> [[true,true,false], [0,0,0]]
// etc...
exports.SwitchStatement = function (node) {
  var stmts = []
  var exprs = [node.discriminant]
  var cases = []
  node.cases.forEach(function (c) {
    stmts = stmts.concat(c.consequent)
    if (c.test) { exprs.push(c.test) }
    cases.push([Boolean(c.test), c.consequent.length])
  })
  return { stmts:stmts, exprs:exprs, infos:[cases] }
}


// interface ReturnStatement <: Statement {
//   type: "ReturnStatement";
//   argument: Expression | null;
// }
//
// [has_argument]
//
// return;        >>> [false]
// return <expr>; >>> [true]
exports.ReturnStatement = function (node) {
  var exprs = node.argument?[node.argument]:[]
  return { stmts:[], exprs:exprs, infos:[Boolean(node.argument)] }
}


// interface ThrowStatement <: Statement {
//   type: "ThrowStatement";
//   argument: Expression;
// }
//
// []
//
// throw <expr>; >>> []
exports.ThrowStatement = function (node) {
  return { stmts:[], exprs:[node.argument], infos:[] }
}


// interface TryStatement <: Statement {
//   type: "TryStatement";
//   block: BlockStatement;
//   handler: CatchClause | null;
//  *guardedHandlers: [ CatchClause ];
//   finalizer: BlockStatement | null;
// }
// interface CatchClause <: Node {
//   type: "CatchClause";
//   param: Pattern;
//  *guard: Expression | null;
//   body: BlockStatement;
// }
//
// [catch_parameter, try_length, catch_length, finally_length]
//
// try {} catch (ID) {}                              >>> ["ID", 0, 0, null]
// try {} finally {}                                 >>> [null, 0, null, 0]
// try {<stmt>} catch (ID) {}                        >>> ["ID", 1, 0, null]
// try {<stmt><stmt>} catch (ID) {}                  >>> ["ID", 2, 0, null]
// try {} catch (ID) {<stmt>}                        >>> ["ID", 0, 1, null]
// try {<stmt>} catch (ID) {<stmt>} finally {<stmt>} >>> ["ID", 1, 1, 1]
// etc..
exports.TryStatement = function (node) {
  var stmts = node.block.body.slice()
  var infos = [stmts.length]
  if (node.handler) {
    infos.push(node.handler.param.name)
    infos.push(node.handler.body.length)
    stmts = stmts.concat(node.handler.body)
  } else {
    infos.push(null)
    infos.push(null)
  }
  if (node.finalizer) {
    infos.push(node.finalizer.body.length)
    stmts = stmts.concat(node.finalizer.body)
  } else {
    infos.push(null)
  }
  return { stmts:stmts, exprs:[], infos:infos }
}


// interface WhileStatement <: Statement {
//   type: "WhileStatement";
//   test: Expression;
//   body: Statement;
// }
//
// []
//
// while (<expr>) <stmt> >>> []
exports.WhileStatement = function (node) {
  return { stmts:[node.body], exprs:[node.test], infos:[] }
}


// interface DoWhileStatement <: Statement {
//   type: "DoWhileStatement";
//   body: Statement;
//   test: Expression;
// }
//
// []
//
// do <stmt> while (<expr>) >>> []
exports.DoWhileStatement = function (node) {
  return { stmts:[node.body], exprs:[node.test], infos:[] }
}


// interface ForStatement <: Statement {
//   type: "ForStatement";
//   init: VariableDeclaration | Expression | null;
//   test: Expression | null;
//   update: Expression | null;
//   body: Statement;
// }
//
// [has_init, has_test, has_update, declarations]
//
// for (<expr>;<expr>;<expr>) <stmt> >>> [true, true, true]
// for (;;) <stmt>                   >>> [false, false, false]
// for (;<expr>;)                    >>> [false, true, false]
// for (var ID=<expr>;;)             >>> [true, false, false, [["ID",true]]]
// for (var ID1=<expr>, ID2;;)       >>> [true, false, false, [["ID1",true],["ID2",false]]]
exports.ForStatement = function (node) {
  var exprs = []
  var infos = [node.init, node.test, node.update].map(Boolean)
  if (node.init) {
    if (node.init.type !== "VariableDeclaration") { exprs.push(node.init) }
    else { infos = infos.push(declaration(node.init, exprs)) }
  }
  if (node.test) { exprs.push(node.test) }
  if (node.update) { exprs.push(node.update) }
  return { stmts:[node.body], exprs:exprs, infos:infos }
}


// interface ForInStatement <: Statement {
//   type: "ForInStatement";
//   left: VariableDeclaration | Expression;
//   right: Expression;
//   body: Statement;
//   each: boolean;
// }
//
// [maybe_declaration, maybe_identifier, maybe_property]
//
// for (var ID in <expr>) <stmt>          >>> [["ID", false], null, null]
// for (var ID=<expr> in <expr>) <stmt>   >>> [["ID",true], null, null]
// for (ID in <expr>) <stmt>              >>> [null, "ID", null]
// for (<expr>.ID in <expr>) <stmt>       >>> [null, null, "ID"]
// for (<expr>[<expr>] in <expr>) <stmt>  >>> [null, null, null]
exports.ForInStatement = function (node) {
  var exprs = [node.right]
  if (node.left.type === "VariableDeclaration") {
    var init = exprs.unshift(node.left.declarations[0].init
    var infos = [[node.left.declarations[0].id.name, Boolean(init)], null, null]
    if (init) { exprs.unshift(init) }
  } else if (node.left.type === "Identifier") {
    var infos = [null, node.left.type.name, null]
  } else if (node.left.type === "MemberExpression") {
    var infos = [null, null, node.left.computed?null:node.left.property.name]
    exprs.push(node.left.object)
    if (node.left.computed) { exprs.push(node.left.property) }
  } else {
    throw new Error(node)
  }
  return { stmts:[node.body], exprs:exprs, infos:infos }
}


// interface FunctionDeclaration <: Function, Declaration {
//   type: "FunctionDeclaration";
//   id: Identifier;
//   params: [ Pattern ];
//  *defaults: [ Expression ];
//  *rest: Identifier | null;
//   body: BlockStatement | Expression;
//  *generator: boolean;
//  *expression: boolean;
// }
//
// [name, parameters, body_length]
//
// function ID () {}              >>> ["ID", 0, []]
// function ID () {<stmt>}        >>> ["ID", 1, []]
// function ID () {<stmt> <stmt>} >>> ["ID", 2, []]
// function ID0 (ID1) {}          >>> ["ID0", 0, ["ID1"]]
// function ID0 (ID1, ID2) {}     >>> ["ID0", 0, ["ID1", "ID2"]]
// etc...
exports.FunctionDeclaration = function (node) {
  return {
    stmts:node.body.body.slice(),
    exprs:[],
    infos:[
      node.id.name,
      node.params.map(function (p) { return p.name }),
      node.body.body.length
    ]
  }
}


// interface VariableDeclaration <: Declaration {
//   type: "VariableDeclaration";
//   declarations: [ VariableDeclarator ];
//  *kind: "var" | "let" | "const";
// }
// interface VariableDeclarator <: Node {
//   type: "VariableDeclarator";
//   id: Pattern;
//   init: Expression | null;
// }
//
// [[initialized,name]]
//
// var ID;              >>> [["ID", false]]
// var ID=<expr>;       >>> [["ID", true]]
// var ID1, ID2=<expr>; >>> [["ID1", false], ["ID2", true]]
// etc...
exports.VariableDeclaration = function (node) {
  var exprs = []
  return { stmts:[], exprs:exprs, infos:declaration(node, exprs) }
}


// interface ThisExpression <: Expression {
//   type: "ThisExpression";
// }
//
// []
//
// this >>> []
exports.ThisExpression = function (node) {
  return { stmts:[], exprs:[], infos:[] }
}


// interface ArrayExpression <: Expression {
//   type: "ArrayExpression";
//   elements: [ Expression | null ];
// }
//
// [are_present]
//
// []              >>> [[]]
// [<expr>]        >>> [[true]]
// [<expr>,<expr>] >>> [[true, true]]
// [<expr>,]       >>> [[true, false]]
// [,,<expr>]      >>> [[false, false, true]]
// etc...
exports.ArrayExpression = function (node) {
  var exprs = []
  var are_present = []
  node.elements.forEach(function (e) {
    if (e) { exprs.push(e) }
    are_present.push(Boolean(e))
  })
  return { stmts:[], exprs:exprs, infos:[are_present] }
}


// interface ObjectExpression <: Expression {
//   type: "ObjectExpression";
//   properties: [ Property ];
// }
// interface Property <: Node {
//   type: "Property";
//   key: Literal | Identifier;
//   value: Expression;
//   kind: "init" | "get" | "set";
// }
//
//
exports.ObjectExpression = function (node) {
  var stmts = []
  var exprs = []
  var infos = node.properties.map(function (p) {
    var info = [p.kind]
    if (p.key.type === "Identifer") { infos.unshift(p.key.name) }
    else { infos.unshift(JSON.stringify(p.key.value)) }
    if (p.kind !== "init") {
      info.push(p.value.body.body.length)
      stmts.push(p.value.body.body.slice())
    } else {
      info.push(null)
      exprs.push(p.value)
    }
    return info
  })
  return { stmts:stmts, exprs:exprs, infos:infos }
}


// interface FunctionExpression <: Function, Expression {
//   type: "FunctionExpression";
//   id: Identifier | null;
//   params: [ Pattern ];
//  *defaults: [ Expression ];
//  *rest: Identifier | null;
//   body: BlockStatement | Expression;
//  *generator: boolean;
//  *expression: boolean;
// }
//
// [name, parameters, body_length]
//
// function () {}               >>> [null, [], 0]
// function ID () {}            >>> ["ID", [], 0]
// function (ID1, ID2) {<stmt>} >>> [null, ["ID1", "ID2"], 1]
// etc..
exports.FunctionExpression = function (node) {
  return {
    stmts:node.body.body.slice(),
    exprs:[],
    infos:[
      node.id?node.id.name:null,
      node.params.map(function (p) { return p.name }),
      node.body.body.length
    ]
  }
}


// interface SequenceExpression <: Expression {
//   type: "SequenceExpression";
//   expressions: [ Expression ];
// }
//
// [expressions_length]
//
// ()               >>> [0]
// (<expr>)         >>> [1]
// (<expr>, <expr>) >>> [2]
// etc...
exports.SequenceExpression = function (node) {
  return { stmts:[], exprs:node.expressions.slice(), infos:[node.expressions.length] }
}


// interface UnaryExpression <: Expression {
//   type: "UnaryExpression";
//   operator: UnaryOperator;
//  !prefix: boolean;
//   argument: Expression;
// }
// enum UnaryOperator {
//   "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
// }
//
// [operator, maybe_identifier, maybe_property]
//
// typeof ID             >>> ["typeof", "ID", null]
// delete ID             >>> ["delete", "ID", null]
// delete <expr>.ID      >>> ["delete", null, "ID"]
// delete <expr>[<expr>] >>> ["delete", null, null]
// delete <expr>         >>> ["delete"]
// OP <expr>             >>> ["OP"]
exports.UnaryExpression = function (node) {
  if (node.operator === "typeof" && node.argument.type === "Identifier") { return {stmts:[], exprs:[], ["typeof", node.argument.name]} }
  if (node.operator === "delete" && node.argument.type === "Identifier") { return {stmts:[], exprs:[], ["delete", node.argument.name, null]} }
  if (node.operator === "delete" && node.argument.type === "MemberExpression") {
    if (node.argument.computed) {
      return {stmts:[], exprs:[node.argument.object, node.argument.property], infos:["delete", null, null]}
    } else {
      return {stmts:[], exprs:[node.argument.object], infos:["delete", null, node.argument.property.name]}
    }
  }
  return { stmts:[], exprs:[node.argument], infos:[node.operator] }
}


// interface BinaryExpression <: Expression {
//   type: "BinaryExpression";
//   operator: BinaryOperator;
//   left: Expression;
//   right: Expression;
// }
// enum BinaryOperator {
//   "==" | "!=" | "===" | "!=="
//        | "<" | "<=" | ">" | ">="
//        | "<<" | ">>" | ">>>"
//        | "+" | "-" | "*" | "/" | "%"
//        | "|" | "^" | "&" | "in"
//        | "instanceof" | ".."
// }
//
// [operator]
//
// <expr> OP <expr> >>> ["OP"]
exports.BinaryExpression = function (node) {
  return { stmts:[], exprs:[node.left, node.right], infos:[node.operator] }
}


// interface AssignmentExpression <: Expression {
//   type: "AssignmentExpression";
//   operator: AssignmentOperator;
//   left: Expression;
//   right: Expression;
// }
// enum AssignmentOperator {
//   "=" | "+=" | "-=" | "*=" | "/=" | "%="
//       | "<<=" | ">>=" | ">>>="
//       | "|=" | "^=" | "&="
// }
//
// [operator, is_identifier, name]
//
// ID OP <expr>             >>> ["OP", "ID", null] 
// <expr>.ID OP <expr>      >>> ["OP", null, "ID"]
// <expr>[<expr>] OP <expr> >>> ["OP", null, null]
exports.AssignmentExpression = function (node) {
  var exprs = [node.right]
  var infos = left(node.left, exprs)
  infos.unshift(node.operator)
  return { stmts:[], exprs:exprs, infos:infos }
}


// interface UpdateExpression <: Expression {
//   type: "UpdateExpression";
//   operator: UpdateOperator;
//   argument: Expression;
//   prefix: boolean;
// }
// enum UpdateOperator {
//   "++" | "--"
// }
//
// [operator, is_identifier, name]
//
// ID OP           >>> [OP, "ID", null]
// <expr>.ID OP    >>> [OP, null, "ID"]
// <expr>[expr] OP >>> [OP, null, null]
exports.UpdateExpression = function (node) {
  var exprs = []
  var infos = left(node.argument, exprs)
  infos.unshift(node.operator)
  return { stmts:[], exprs:exprs, infos:infos }
}


// interface LogicalExpression <: Expression {
//   type: "LogicalExpression";
//   operator: LogicalOperator;
//   left: Expression;
//   right: Expression;
// }
// enum LogicalOperator {
//   "||" | "&&"
// }
//
// [operator]
//
// <expr> OP <expr> >>> [OP]
exports.LogicalExpression = function (node) {
  return { stmts:[], exprs:[node.left, node.right], infos:[node.operator] }
}


// interface ConditionalExpression <: Expression {
//   type: "ConditionalExpression";
//   test: Expression;
//   alternate: Expression;
//   consequent: Expression;
// }
//
// []
//
// <expr>?<expr>:<expr> >>> []
exports.ConditionalExpression = function (node) {
  return { stmts:[], exprs:[node.test, node.alternate, node.consequent], infos:[] }
}


// interface NewExpression <: Expression {
//   type: "NewExpression";
//   callee: Expression;
//   arguments: [ Expression ];
// }
//
// [arguments_length]
//
// new <expr>()              >>> [0]
// new <expr>(<expr>)        >>> [1]
// new <expr>(<expr>,<expr>) >>> [2]
exports.NewExpression = function (node) {
  var exprs = node.arguments.slice()
  exprs.unshift(node.callee)
  return {
    stmts:[],
    exprs:exprs,
    infos:[node.arguments.length]
  }
}


// interface CallExpression <: Expression {
//   type: "CallExpression";
//   callee: Expression;
//   arguments: [ Expression ];
// }
//
// [arguments_length, is_member, maybe_property]
//
// <expr>()                      >>> [0, false, null]
// <expr>(<expr>)                >>> [1, false, null]
// <expr>(<expr>,<expr>)         >>> [2, false, null]
// <expr>.ID(<expr>,<expr>)      >>> [2, true, "ID"]
// <expr>[<expr>](<expr>,<expr>) >>> [2, true, null]
exports.CallExpression = function (node) {
  var exprs = node.arguments.slice()
  var is_member = node.callee.type === "MemberExpression"
  var infos = [node.arguments.length, is_member]
  if (is_member) {
    var is_computed = node.callee.computed
    infos.push(is_computed)
    if (is_computed) { exprs.unshift(node.property) }
    exprs.unshift(node.callee.object)
  } else {
    exprs.unshift(node.callee)
  }
  return { stmts:[], exprs:exprs, infos:infos }
}


// interface MemberExpression <: Expression {
//   type: "MemberExpression";
//   object: Expression;
//   property: Identifier | Expression;
//   computed: boolean;
// }
//
// [property_name]
//
// <expr>.ID      >>> ["ID"]
// <expr>[<expr>] >>> [null]
exports.MemberExpression = function (node) {
  var exprs = [node.object]
  var infos = []
  if (node.computed) {
    exprs.push(node.property)
  } else {
    if (node.property.type !== "Identifier") { throw new Error(node) }
    infos.push(node.property.name)
  }
  return { stmts:[], exprs:exprs, infos:infos }
}


// interface Identifier <: Node, Expression, Pattern {
//   type: "Identifier";
//   name: string;
// }
//
// [name]
//
// ID >>> ["ID"]
exports.Identifier = function (node) {
  return { stmts:[], exprs:[], infos:[node.name] }
}


// interface Literal <: Node, Expression {
//   type: "Literal";
//   value: string | boolean | null | number | RegExp;
// }
//
// [value]
//
// LIT >>> [LIT]
exports.Literal = function (node) {
  return { stmts:[], exprs:[], infos:[node.value] }
}
