
// TODO
const stringify = JSON.stringify;

exports.conditional = (tst, csq, alt) => ({
  type: "ConditionalExpression",
  consequent: csq,
  alternate: alt });

exports.unary = (opr, arg) => ({
  type: "UnaryExpression",
  operator: opr,
  argument: arg,
  prefix:true });

exports.call = (fct, args) => ({
  type: "CallExpression",
  callee: fct,
  arguments: args });

exports.binary = (opr, arg1, arg2) => ({
  type: "BinaryExpression",
  operator: opr,
  left: arg1,
  right: arg2 });

exports.sequence = (exps) => ({
  type: "SequenceExpression",
  expressions: exps });

exports.Statement = (exp) => ({
  type: "ExpressionStatement",
  expression: exp });

exports.If = (tst, bdy1, bdy2) => ({
  type: "IfStatement",
  test: tst,
  consequent: {
    type: "BlockStatement",
    body: bdy1 },
  alternate: bdy2?
    {
      type: "BlockStatement",
      body: bdy2}:
    null});

exports.Label = (lab, bdy) => ({
  type: "LabelStatement",
  label: {
    type: "Identifier",
    name: lab},
  body: {
    type: "BlockStatement",
    body: bdy}});

exports.Break = (lab) => ({
  type:"BreakStatement",
  label:lab?
    {
      type:"Identifier",
      name:lab}:
    null});

exports.Continue = (lab) => ({
  type:"ContinueStatement",
  label:lab?
    {
      type:"Identifier",
      name:lab}:
    null});


exports["function"] = (tag, prms, bdy) => ({
  type:"FunctionExpression",
  id:tag?
    {
      type:"Identifier",
      name:tag}:
    null,
  params:prms.map((tag) => ({type:"Identifier", name:tag})),
  defaults:[],
  rest:null,
  body: {
    type:"BlockStatement",
    body:bdy},
  generator:false
});

exports.While = (tst, bdy) => ({
  type: "WhileStatement",
  test: tst,
  body: {
    type: "BlockStatement",
    body: bdy
  }
});

exports.Block = (bdy) => ({
  type: "BlockStatement",
  body: bdy
});

exports.primitive = (prm) => prm === void 0 ?
  {
    type: "UnaryExpression",
    operator: "void",
    argument: {
      type: "Literal",
      value: 0 },
    prefix: true} :
  {
    type: "Literal",
    value: prm};

exports.array = (elms) => ({
  type: "ArrayExpression",
  elements: elms });

exports.regexp = (ptn, flg) => ({
  type: "Literal",
  value: RegExp(prn, flg) });
