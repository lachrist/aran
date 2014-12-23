
(function () {


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
  // ID             >>> [true, "ID"]
  // <expr>.ID      >>> [false, "ID"]
  // <expr>[<expr>] >>> [false, null]
  function left (node, exprs) {
    if (node.type === "Identifier") { return [true, node.name] }
    if (node.type !== "MemberExpression") { throw new Error(node) }
    exprs.push(node.object)
    if (node.computed) {
      exprs.push(node.property)
      return [false, null]
    }
    if (node.property.type !== "Identifier") { throw new Error(node) }
    return [false,node.property.name]
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

  ///////////
  // Miley //
  ///////////


  var miley = {}
  aran.miley = function (node) {
    if (miley[node.type]) return miley[node.type](node)
    throw new Error(node)
  }


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
  miley.Program = function (node) {
    return { stmts:node.body.slice(), exprs:[], infos:[node.body.length] }
  }


  // interface EmptyStatement <: Statement {
  //   type: "EmptyStatement";
  // }
  //
  // []
  //
  // ; >>> []
  miley.EmptyStatement = function (node) {
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
  miley.BlockStatement = function (node) {
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
  miley.ExpressionStatement = function (node) {
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
  miley.IfStatement = function (node) {
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
  miley.LabeledStatement = function (node) {
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
  miley.BreakStatement = function (node) {
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
  miley.ContinueStatement = function (node) {
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
  miley.WithStatement = function (node) {
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
  miley.SwitchStatement = function (node) {
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
  miley.ReturnStatement = function (node) {
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
  miley.ThrowStatement = function (node) {
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
  miley.TryStatement = function (node) {
    var stmts = node.block.body.slice()
    if (node.handler) {
      var infos = [node.handler.param.name, node.block.body.length, node.handler.body.length]
      stmts = stmts.concat(node.handler.body)
    } else { var infos = [null, node.block.body.length, null] }
    if (node.finalizer) {
      infos.push(node.finalizer.body.length)
      stmts = stmts.concat(node.finalizer.body)
    } else { infos.push(null) }
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
  miley.WhileStatement = function (node) {
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
  miley.DoWhileStatement = function (node) {
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
  miley.ForStatement = function (node) {
    var exprs = []
    var infos = [node.init, node.test, node.update].map(Boolean)
    if (node.init) {
      if (node.init.type !== "VariableDeclaration") { exprs.push(node.init) }
      else { infos = infos.concat(declaration(node.init, exprs)) }
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
  // [is_declaration, is_identifier/is_initialized, name]
  //
  // for (var ID in <expr>) <stmt>          >>> [true, false, "ID"]
  // for (var ID=<expr> in <expr>) <stmt>   >>> [true, true, "ID"]
  // for (ID in <expr>) <stmt>              >>> [false, true, "ID"]
  // for (<expr>.ID in <expr>) <stmt>       >>> [false, false, "ID"]
  // for (<expr>[<expr>] in <expr>) <stmt>  >>> [false, false, null]
  miley.ForInStatement = function (node) {
    var has_var = node.left.type === "VariableDeclaration"
    var exprs = []
    var infos
    if (has_var) {
      if (node.left.declarations.length != 1) { throw new Error(node) }
      var is_init = Boolean(node.left.declarations[0].init)
      infos = [true, is_init, node.left.declarations[0].id.name]
      if (is_init) { exprs.push(node.left.declarations[0].init) }
    } else {
      infos = left(node.left, exprs)
      infos.unshift(false)
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
  miley.FunctionDeclaration = function (node) {
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
  // var ID;              >>> [["ID"], [false]]
  // var ID=<expr>;       >>> [["ID"], [true]]
  // var ID1, ID2=<expr>; >>> [["ID1","ID2"], [false, true]]
  // etc...
  miley.VariableDeclaration = function (node) {
    var exprs = []
    return { stmts:[], exprs:exprs, infos:[declaration(node, exprs)] } 
  }


  // interface ThisExpression <: Expression {
  //   type: "ThisExpression";
  // }
  //
  // []
  //
  // this >>> []
  miley.ThisExpression = function (node) {
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
  miley.ArrayExpression = function (node) {
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
  miley.ObjectExpression = function (node) {
    var exprs = []
    var props = []
    node.properties.forEach(function (p) {
      exprs.push(p.value)
      var is_id = p.key.type === "Identifier"
      props.push([p.kind, is_id, is_id?p.key.name:p.key.value])
    })
    return { stmts:[], exprs:exprs, infos:[props] }
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
  miley.FunctionExpression = function (node) {
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
  miley.SequenceExpression = function (node) {
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
  // [operator, is_identifier, name]
  //
  // OP <expr>             >>> [OP]
  // delete ID             >>> [delete, true, ID]
  // delete <expr>.ID      >>> [delete, false, ID]
  // delete <expr>[<expr>] >>> [delete, false, null]
  miley.UnaryExpression = function (node) {
    if (node.operator === "delete") {
      var exprs = []
      var infos = left(node.argument, exprs)
      infos.unshift("delete")
      return { stmts:[], exprs:exprs, infos:infos }
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
  // <expr> OP <expr> >>> [OP]
  miley.BinaryExpression = function (node) {
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
  // ID OP <expr>             >>> [OP, true, ID] 
  // <expr>.ID OP <expr>      >>> [OP, false, ID]
  // <expr>[<expr>] OP <expr> >>> [OP, false, null]
  miley.AssignmentExpression = function (node) {
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
  // ID OP           >>> [OP, true, "ID"]
  // <expr>.ID OP    >>> [OP, false, "ID"]
  // <expr>[expr] OP >>> [OP, false, null]
  miley.UpdateExpression = function (node) {
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
  miley.LogicalExpression = function (node) {
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
  miley.ConditionalExpression = function (node) {
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
  miley.NewExpression = function (node) {
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
  // [arguments_length, is_member, is_computed]
  //
  // <expr>()                      >>> [0, false]
  // <expr>(<expr>)                >>> [1, false]
  // <expr>(<expr>,<expr>)         >>> [2, false]
  // <expr>.<id>(<expr>,<expr>)    >>> [2, true, false]
  // <expr>[<expr>](<expr>,<expr>) >>> [2, true, true]
  miley.CallExpression = function (node) {
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
  miley.MemberExpression = function (node) {
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
  miley.Identifier = function (node) {
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
  miley.Literal = function (node) {
    return { stmts:[], exprs:[], infos:[node.value] }
  }


} ());
