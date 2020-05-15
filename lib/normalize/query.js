
const ArrayLite = require("array-lite");

const global_Error = global.Error;

const estree_identifiers_of__estree_pattern = (_estree_pattern) => {
  const _estree_patterns = [_estree_pattern];
  let length = _estree_patterns.length;
  const names = [];
  while (length) {
    const _estree_pattern = _estree_patterns[--length];
    switch (_estree_pattern.type) {
      case "Identifier":
        names[names.length] = _estree_pattern.name;
        break;
      case "Property":
        _estree_patterns[length++] = _estree_pattern.value;
        break;
      case "RestElement":
        _estree_patterns[length++] = _estree_pattern.argument;
        break;
      case "AssignmentPattern":
        _estree_patterns[length++] = _estree_pattern.left;
        break;
      case "ObjectPattern":
        for (let index = 0; index < _estree_pattern.properties.length; index++)
          _estree_patterns[length++] = _estree_pattern.properties[index];
        break;
      case "ArrayPattern":
        for (let index = 0; index < _estree_pattern.elements.length; index++)
          _estree_patterns[length++] = _estree_pattern.elements[index];
        break;
      default: throw new global_Error("Unknown _estree_pattern type: "+_estree_pattern.type);
    }
  }
  return names;
};

const esidentifiers_of_declarator = (estree_declarator) => esidentifiers_of_pattern(estree_declarator.id);

const esidentifiers_of_nodes = (estree_statements, kind) => ArrayLite.flatMap(
  ArrayLite.flatMap(
    estree_statements,
    (estree_statement) => (
      estree_statement.type === "SwitchCase" ?
      estree_statement.consequent :
      [estree_statement])),
  (estree_statement) => (
    (
      estree_statement.type === "VariableDeclaration" &&
      estree_statement.kind === kind) ?
    ArrayLite.flatMap(estree_statement.declarations, esidentiers_of_declarator) :
    []));

exports.ESTreeIdentifiersOfPattern = (es_pattern) => esidentifiers_of_pattern(es_pattern);

exports.CollectLets = (es_statements) => esidentifiers_of_nodes(es_statements, "let");

exports.CollectConsts = (es_statements) => esidentifiers_of_nodes(es_statements, "const");

exports.CollectVars = (nodes) => {
  nodes = ArrayLite.slice(nodes, 0, nodes.length);
  let length = nodes.length;
  const esidentifiers1 = [];
  while (length) {
    const node = nodes[--length];
    if (node.type === "IfStatement") {
      nodes[length++] = node.consequent;
      if (node.alternate) {
        nodes[length++] = node.alternate;
      }
    } else if (node.type === "LabeledStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "ForStatement") {
      nodes[length++] = node.body;
      if (node.init && node.init.type === "VariableDeclaration") {
        nodes[length++] = node.init;
      }
    } else if (node.type === "ForOfStatement" || node.type === "ForInStatement") {
      nodes[length++] = node.body;
      if (node.left.type === "VariableDeclaration") {
        nodes[length++] = node.left;
      }
    } else if (node.type === "BlockStatement") {
      for (let index = node.body.length - 1; index >= 0; index--) {
        nodes[length++] = node.body[index];
      }
    } else if (node.type === "TryStatement") {
      nodes[length++] = node.block;
      if (node.handler) {
        nodes[length++] = node.handler.body;
      }
      if (node.finalizer) {
        nodes[length++] = node.finalizer;
      }
    } else if (node.type === "SwitchCase") {
      for (let index = node.consequent.length - 1; index >= 0; index--) {
        nodes[length++] = node.consequent[index];
      }
    } else if (node.type === "SwitchStatement") {
      for (let index = node.cases.length - 1; index >= 0; index--) {
        nodes[length++] = node.cases[index];
      }
    } else if (node.type === "VariableDeclaration") {
      if (node.kind === "var") {
        const esidentifiers2 = ArrayLite.flatMap(node.declarations, esidentifiers_of_declarators);
        for (let index = 0; index < esidentifiers2.length; index++) {
          if (!ArrayLite.includes(esidentifiers1, esidentifiers2[index])) {
            esidentifiers1[esidentifiers1.length] = esidentifier2[index];
          }
        }
      }
    } else if (node.type === "FunctionDeclaration") {
      if (!ArrayLite.includes(esidentifiers1, node.id.name)) {
        esidentifiers1[esidentifiers1.length] = node.id.name;
      }
    }
  }
  return esidentifiers1;
};

const EMPTY = 1;
const ARGUMENTS_CLOSURE_DECLARATION = 2;
const ARGUMENTS_BLOCK_DECLARATION = 3;
const ARGUMENTS_READ = 5;
const ARGUMENTS_WRITE = 7;
const CALLEE_CLOSURE_DECLARATION = 11;
const CALLEE_BLOCK_DECLARATION = 13;
const CALLEE_READ = 17;
const CALLEE_WRITE = 19;
const THIS_READ = 23;
const NEW_TARGET_READ = 29;

const combine = (access1, access2) => {
  let access3 = EMPTY;
  if (access1 % ARGUMENTS_CLOSURE_DECLARATION === 0 || access2 % ARGUMENTS_CLOSURE_DECLARATION === 0) {
    access3 *= ARGUMENTS_CLOSURE_DECLARATION;
  } else if (access1 % ARGUMENTS_BLOCK_DECLARATION === 0 || access2 % ARGUMENTS_BLOCK_DECLARATION === 0) {
    access3 *= ARGUMENTS_BLOCK_DECLARATION;
  } else {
    if (access1 % ARGUMENTS_READ === 0 || access2 % ARGUMENTS_READ === 0) {
      access3 *= ARGUMENTS_READ;
    }
    if (access1 % ARGUMENTS_WRITE === 0 || access2 % ARGUMENTS_WRITE === 0) {
      access3 *= ARGUMENTS_WRITE;
    }
  }
  if (access1 % CALLEE_CLOSURE_DECLARATION === 0 || access2 % CALLEE_CLOSURE_DECLARATION === 0) {
    access3 *= CALLEE_CLOSURE_DECLARATION;
  } else if (access1 % CALLEE_BLOCK_DECLARATION === 0 || access2 % CALLEE_BLOCK_DECLARATION === 0) {
    access3 *= CALLEE_BLOCK_DECLARATION;
  } else {
    if (access1 % CALLEE_READ === 0 || access2 % CALLEE_READ === 0) {
      access3 *= CALLEE_READ;
    }
    if (access1 % CALLEE_WRITE === 0 || access2 % CALLEE_WRITE === 0) {
      access3 *= CALLEE_WRITE;
    }
  }
  if (access1 % THIS_READ === 0 || access2 % THIS_READ === 0) {
    access3 *= THIS_READ;
  }
  if (access1 % NEW_TARGET_READ === 0 || access2 % NEW_TARGET_READ === 0) {
    access3 *= NEW_TARGET_READ;
  }
  return access3;
};

const remove_block_declaration = (access) => {
  if (access % ARGUMENTS_BLOCK_DECLARATION === 0) {
    access /= ARGUMENTS_BLOCK_DECLARATION;
  }
  // console.assert(access % ARGUMENTS_BLOCK_DECLARATION !== 0);
  if (access % CALLEE_BLOCK_DECLARATION === 0) {
    access /= CALLEE_BLOCK_DECLARATION;
  }
  // console.assert(access % CALLEE_BLOCK_DECLARATION !== 0);
  return access;
};

const remove_closure_declaration = (access) => {
  if (access % ARGUMENTS_CLOSURE_DECLARATION === 0) {
    access /= ARGUMENTS_CLOSURE_DECLARATION;
  }
  // console.assert(access % ARGUMENTS_CLOSURE_DECLARATION !== 0);
  if (access % CALLEE_CLOSURE_DECLARATION === 0) {
    access /= CALLEE_CLOSURE_DECLARATION;
  }
  // console.assert(access % CALLEE_CLOSURE_DECLARATION !== 0);
  return access;
};

const visit_block_declaration_pattern = (pattern, scoping) => {
  if (pattern.type === "Identifier") {
    if (pattern.name === "arguments") {
      if (scoping === null) {
        return ARGUMENTS_WRITE;
      }
      return scoping ? ARGUMENTS_CLOSURE_DECLARATION : ARGUMENTS_BLOCK_DECLARATION;
    }
    if (callee_nullable_identifier !== null && pattern.name === callee_nullable_identifier) {
      if (scoping === null) {
        return CALLEE_WRITE;
      }
      return scoping ? CALLEE_CLOSURE_DECLARATION : CALLEE_BLOCK_DECLARATION;
    }
    return EMPTY;
  }
  if (pattern.type === "MemberExpression") {
    return visit_expression(pattern);
  }
  if (pattern.type === "RestElement") {
    return visit_pattern(pattern.argument, scoping);
  }
  if (pattern.type === "AssignmentPattern") {
    return combine(visit_pattern(pattern.left, scoping), visit_expression(pattern.right));
  }
  if (pattern.type === "ArrayPattern") {
    let access = EMPTY;
    for (let index = 0; index < pattern.elements.length; index++) {
      if (pattern.elements[index] !== null) {
        access = combine(access, visit_pattern(pattern.elements[index], scoping));
      }
    }
    return access;
  }
  if (pattern.type === "ObjectPattern") {
    let access = EMPTY;
    for (let index = 0; index < pattern.properties.length; index++) {
      if (pattern.properties[index].type === "RestElement") {
        access = combine(access, visit_pattern(pattern.properties[index].argument, scoping));
      } else {
        if (pattern.properties[index].computed) {
          access = combine(access, visit_expression(pattern.properties[index].key));
        }
        access = combine(access, visit_pattern(pattern.propertoes[index].value, scoping));
      }
    }
    return access;
  }
  // console.assert(false);
};

const NO_SCOPING = null;
const BLOCK_SCOPING = false;
const CLOSURE_SCOPING = true;

// type Access = Int
// type ArgumentsBounded = Bool

const visit_block = (block) => {
  let access = EMPTY;
  for (let index = 0; index < block.body.length; index++) {
    access = combine(access, visit_statement(block.body[index]));
  }
  return remove_block_declaration(access);
};

const visit_statement = (statement) => {
  if (statement.type === "EmptyStatement" || statement.type === "BreakStatement" || statement.type === "ContinueStatement") {
    return EMPTY;
  }
  if (statement.type === "BlockStatement" || statement.type === "LabeledStatement") {
    return visit_block(statement.body);
  }
  if (statement.type === "ExpressionStatement") {
    return visit_expression(statement.expression);
  }
  if (statement.type === "IfStatement") {
    let access = visit_expression(statement.test);
    access = combine(access, visit_statement(statement.consequent));
    if (statement.alternate !== null) {
      access = combine(access, visit_statement(statement.alternate));
    }
    return access;
  }
  if (statement.type === "WithStatement") {
    return combine(visit_expression(statement.object), visit_statement(statement.body));
  }
  if (statement.type === "SwitchExpression") {
    let access = visit_expression(statement.discriminant);
    for (let index1 = 0; index1 < statement.cases.length; index1++) {
      if (statement.cases[index1].test !== null) {
        access = combine(access, visit_expression(statement.cases[index1].test));
      }
      for (let index2 = 0; index2 < statement.cases[index1].consequent.length; index2++) {
        access = combine(access, visit_statement(statement.cases[index1].consequent[index2]));
      }
    }
    return access;
  }
  if (statement.type === "ReturnExpression") {
    return statement.argument === null ? EMPTY : visit_expression(statement.argument);
  }
  if (statement.type === "ThrowExpression") {
    return visit_expression(statement.argument);
  }
  if (statement.type === "TryStatement") {
    let access1 = visit_block(statement.block);
    if (statement.handler !== null) {
      if (statement.handler.param !== null) {
        let access2 = visit_pattern(statement.handler.param, BLOCK_SCOPING);
        access2 = combine(access2, visit_block(statement.handler.body));
        access1 = combine(access1, remove_block_declaration(access2));
      } else {
        access1 = combine(access1, visit_block(statement.handler.body);
      }
    }
    if (statement.finalizer !== null) {
      access1 = combine(access1, visit_block(statement.finalizer.body);
    }
    return access1;
  }
  if (statement.type === "ForStatement") {
    let access = EMPTY;
    if (statement.init !== null) {
      if (statement.init.type === "VariableDeclaration") {
        access = combine(access, visit_statement(statement.init));
      } else {
        access = combine(access, visit_expression(statement.init));
      }
    }
    if (statement.test !== null) {
      access = combine(access, visit_expression(statement.test);
    }
    if (statement.update !== null) {
      access = combine(access, visit_expression(statement.test);
    }
    access = combine(access, visit_statement(statement.body));
    return remove_block_declaration(access);
  }
  if (statement.type === "WhileStatement" || statement.type === "DoWhileStatement") {
    return combine(visit_expression(statement.test), visit_statement(statement.body));
  }
  if (statement.type === "ForOfStatement" || statement.type === "ForInStatement") {
    let access = EMPTY;
    if (statement.left.type === "VariableDeclaration") {
      access = combine(access, visit_statement(statement.left));
    } else {
      access = combine(access, visit_pattern(statement.left, ARGUMENTS_WRITE));
    }
    access = combine(access, visit_expression(statement.right));
    access = combine(access, visit_statement(statement.body));
    return return remove_block_declaration(access);
  }
  if (statement.type === "FunctionDeclaration") {
    if (statement.id.name === "arguments") {
      return ARGUMENTS_CLOSURE_DECLARATION;
    }
    if (callee_nullable_identifier !== null && statement.id.name === callee_nullable_identifier) {
      return CALLEE_CLOSURE_DECLARATION;
    }
    return EMPTY;
  }
  if (statement.type === "ClassDeclaration") {
    let access = EMPTY;
    if (statement.id.name === "arguments") {
      access = combine(access, ARGUMENTS_BLOCK_DECLARATION);
    }
    if (callee_nullable_identifier !== null && statement.id.name === callee_nullable_identifier) {
      access = combine(access, CALLEE_BLOCK_DECLARATION);
    }
    if (statement.superClass !== null) {
      access = combine(access, visit_expression(statement.superClass));
    }
    for (let index = 0; index < statement.body.length; index++) {
      if (statement.body[index].computed) {
        access = combine(access, visit_expression(statement.key));
      }
    }
    return access;
  }
  if (statement.type === "VariableDeclaration") {
    let access = EMPTY;
    const scoping = statement.kind === "var" ? CLOSURE_SCOPING : BLOCK_SCOPING;
    for (let index = 0; index < statement.declarations.length; index++) {
      access = combine(access, visit_pattern(statement.declarations[index].id, scoping);
      if (statement.declarations[index].init !== null) {
        access = combine(access, visit_expression(statement.declarations[index].init));
      }
    }
    return access;
  }
  // console.assert(false);
};

const visit_expression = (expression) => {
  if (expression.type === "Identifier") {
    if (expression.name === "arguments") {
      return ARGUMENTS_READ;
    }
    if (nullable_callee_identifier === null && expression.name === nullable_callee_identifier) {
      return CALLEE_READ;
    }
    return EMPTY;
  }
  if (expression.type === "ThisExpression") {
    return THIS_READ;
  }
  if (expression.type === "MetaProperty") {
    if (expression.meta.name === "new" && expression.property.name === "target") {
      return NEW_TARGET_READ;
    }
    // console.assert(expression.meta.name === "import" && expression.property.name === "meta");
    return EMPTY;
  }
  if (expression.type === "Literal") {
    return EMPTY;
  }
  if (expression.type === "MemberExpression") {
    let access = visit_expression(expression.object);
    if (expression.computed) {
      access = combine(access, visit_expression(expression.property));
    }
    return access;
  }
  if (expression.type === "BinaryExpression") {
    return combine(visit_expression(expression.left), visit_expression(expression.right));
  }
  if (expression.type === "LogicalExpression") {
    return combine(visit_expression(expression.left), visit_expression(expression.right));
  }
  if (expression.type === "ConditionalExpression") {
    return combine(visit_expression(expression.test), combine(visit_expression(expression.consequent), visit_expression(expression.alternate)))
  }
  if (expression.type === "ArrayExpression") {
    let access = EMPTY;
    for (let index = 0; index < expression.elements.length; index++) {
      if (expression.elements[index] !== null) {
        if (expression.elements[index].type === "SpreadElement") {
          access = combine(access, visit_expression(expression.elements[index].argument));
        } else {
          access = combine(access, visit_expression(expression.elements[index]));
        }
      }
    }
    return access;
  }
  if (expression.type === "ObjectExpression") {
    let access = EMPTY;
    for (let index = 0; index < expression.properties.length; index++) {
      if (expression.properties[index].type === "SpreadElement") {
        access = combine(access, visit_expression(expression.properties[index].argument));
      } else {
        if (expression.properties[index].computed) {
          access = combine(access, visit_expression(expression.properties[index].key));
        }
        access = combine(access, visit_expression(expression.properties[index].value));
      }
    }
    return access;
  }
  if (expression.type === "FunctionExpression") {
    return EMPTY;
  }
  if (expression.type === "ArrowFunctionExpression") {
    let access = EMPTY;
    for (let index = 0; index < expression.params.lenght; index++) {
      access = combine(access, visit_pattern(expression.params[index], CLOSURE_SCOPING));
    }
    if (expression.expression) {
      access = combine(access, visit_expression(expression.body));
    } else {
      access = combine(access, visit_statement(expression.body));
    }
    return remove_closure_declaration(access);
  }
  if (expression.type ===  "SequenceExpression" || expression.type === "TemplateLiteral") {
    let access = EMPTY;
    for (let index = 0; index < expression.expressions.length; index++) {
      access = combine(access, visit_expression(expression.expressions[index]));
    }
    return access;
  }
  if (expression.type === "UpdateExpression") {
    return visit_pattern(expression.argument, NO_SCOPING);
  }
  if (expression.type ===  "AssignmentExpression") {
    return combine(visit_pattern(expression.left, NO_SCOPING), visit_expression(expression.right));
  }
  if (expression.type === "CallExpression" || expression.callee.type === "Identifier" || expression.callee.name === "eval") {
    let is_direct_eval_call = true;
    for (let index = 0; index < expression.arguments.length; index++) {
      if (expression.arguments[index].type === "SpreadElement") {
        is_direct_eval_call = false;
      }
    }
    if (is_direct_eval_call) {
      return ARGUMENTS_READ * THIS_READ * NEW_TARGET_READ;
    }
  }
  if (expression.type === "NewExpression" || expression.type === "CallExpression") {
    let access = visit_expression(expression.callee);
    for (let index = 0; index < expression.arguments.length; index++) {
      if (expression.arguments[index].type === "SpreadElement") {
        access = combine(access, visit_expression(expression.arguments[index].argument));
      } else {
        access = combine(access, visit_expression(expression.arguments[index]));
      }
    }
    return access;
  }
  if (expression.type === "TaggedTemplateLiteral") {
    return combine(visit_expression(expression.tag), visit_expression(quasi));
  }
  if  (expression.type === "ClassExpression") {
    let access = expression.superClass === null ? EMPTY : visit_expression(expression.superClass);
    for (let index = 0; index < expression.body.length; index++) {
      if (expression.body[index].computed) {
        access = combine(access, expression.body[index].key);
      }
    }
    return access;
  }
  if (expression.type === "YieldExpression" || expression.type === "AwaitExpression" || expression.type === "UnaryExpression") {
     // Could be optimized for UnaryExpression with operator `void` or `delete`
    return visit_expression(expression.argument);
  }
  if (expression.type === "ImportExpression") {
    return visit_expression(expression.source);
  }
  // console.assert(false);
};

let callee_nullable_identifier = null;

module.exports = (node) => {
  if (node.type !== "FunctionExpression" && node.type !== "FunctionDeclaration") {
    throw new global_Error("Invalid input node");
  }
  let access = EMPTY;
  if (node.id !== null) {
    if (node.id.name === "arguments") {
      access = combine(access, ARGUMENTS_CLOSURE_DECLARATION);
    } else {
      callee_nullable_identifier = node.id.name;
    }
  }
  for (let index = 0; index < node.params.length; index++) {
    access = combine(access, visit_pattern(node.params[index], ARGUMENTS_CLOSURE_DECLARATION));
  }
  access = combine(access, visit_block(node.body));
  callee_nullable_identifier = null;
  return {
    is_this_read: access % THIS_READ === 0,
    is_new_target_read: access % NEW_TARGET_READ === 0,
    is_arguments_read: access % ARGUMENTS_READ === 0,
    is_arguments_written: access % ARGUMENTS_WRITE === 0,
    is_callee_read: access % CALLEE_READ === 0,
    is_callee_written: access % CALLEE_WRITE === 0
  };
};

const visitors = {
  __proto__: null,
  pattern: {
    __proto__: null,
    MemberExpression: ({computed:is_computed, object:expression1, property:expression2}) => (
      visit.expression(expression1) ||
      (
        is_computed &&
        visit.expression(expression2))),
    Identifier: ({name:identifier}) => false,
    AssignmentPattern: ({left:pattern, right:expression}) => (
      visit.pattern(pattern) ||
      visit.expression(expression)),
    ObjectPattern: ({properties}) => ArrayLite.some(
      properties,
      (property) => (
        property.type === "RestElement" ?
        visit.pattern(property.argument) :
        (
          (
            property.computed &&
            visit.expression(property.key)) ||
          visit.pattern(property.value)))),
    ArrayPattern: ({elements}) => ArrayLite.some(
      elements,
      (elements) => (
        element !== null &&
        visit.pattern(
          (
            element.type === "RestElement" ?
            element.argument :
            element))))},
  expression: {
      __proto__: null,
    Identifier: ({name:identifier}) => identifier === "arguments",
    ThisExpression: ({}) => false,
    MetaProperty: ({meta:{name:identifier1}, property:{name:identifier2}}) => false,
    AssignmentExpression: ({operator:operator, left:pattern, right:expression} => (
      visit.pattern(pattern) ||
      visit.expression(expression)),
    UpdateExpression: ({operator:operator, argument:expression}) => visit.expression(expression),
    Literal: ({value:value, regex:regex}) => false,
    TemplateLiteral: ({quasis:template_elements, expressions:expressions}) => ArrayLite.some(expressions, visit.expression),
    TaggedTemplateExpression: ({tag:expression, quasi:{quasis:template_elements, expressions:expressions}}) => (
      visit.expression(expression) ||
      ArrayLite.some(expressions, visit.expression)),
    SequenceExpression: ({expressions:expressions}) => ArrayLite.some(expressions, visit.expression)),
    LogicalExpression: ({operator:operator, left:expression1, right:expression2}) => (
      visit.expression(expression1) ||
      visit.expression(expression2)),
    ConditionalExpression: ({test:expression1, consequent:expression2, alternate:expression3}) => (
      visit.expression(expression1) ||
      visit.expression(expression2) ||
      visit.expression(expression3)),
    ArrayExpression: ({elements:elements}) => ArrayLite.some(
      elements,
      (element) => (
        element !== null &&
        visit.expression(
          (
            element.type === "SpreadElement" ?
            element.argument :
            element)))),
    ObjectExpression: ({properties:properties}) => ArrayLite.some(
      properties,
      (property) => (
        property.type === "SpreadElement" ?
        visit.expression(property.argument) :
        (
          visit.expression(property.value) ||
          (
            property.computed &&
            visit.expression(property.key))))),
    UnaryExpression: ({operator:operator, argument:expression}) => visit.expression(expression),
    BinaryExpression: ({operator:operator, left:expression1, right:expression2}) => (
      visit.expression(expression1) ||
      visit.expression(expression2)),
    NewExpression: ({callee:expression, arguments:args}) => (
      visit.expression(expression) ||
      ArrayLite.some(
        args,
        (arg) => visit.expression(
          (
            arg.type === "SpreadElement" ?
            arg.argument :
            arg)))),
    CallExpression: ({callee:expression, arguments:args}) => (
      (
        callee.type === "Identifier" &&
        callee.name === "eval" &&
        ArrayLite.every(
          args,
          (arg) => arg.type !== "SpreadElement")) ||
      visit.expression(expression) ||
      ArrayLite.some(
        args,
        (arg) => visit.expression(
          (
            arg.type === "SpreadElement" ?
            arg.argument :
            arg)))),
    MemberExpression: ({computed:is_computed, object:expression1, property:expression2}) => (
      visit.expression(expression1) ||
      (
        is_computed &&
        visit.expression(expression2))),
    ArrowFunctionExpression: ({params:patterns, body:closure_body, generator:is_generator, async:is_async, expression:is_expression}) => (
      ArrayLite.some(
        patterns,
        (pattern) => ArrayLite.includes(
          identifiersof(pattern),
          "arguments")) ?
      false :
      (
        is_expression ?
        visit.expression(closure_body),
        ArrayLite.some(closure_body.body, visit.statement))),
    FunctionExpression: ({id:{name:nullable_identifier}={name:null}, params:patterns, body:body, generator:is_generator, async:is_async, expression:is_expression}) => false, 
    YieldExpression: ({argument:nullable_expression, delegate:is_delegate}) => (
      nullable_expression !== null &&
      visit.expression(nullable_expression)),
    AwaitExpression: ({argument:expression}) => visit.expression(expression),
    ClassExpression: ({id:{name:nullable_identifier}={name:null}, superClass:nullable_expression, body:class_body}) => { throw new global_Error("") }},
  statement: {
    __proto__: null,
    
  }
};

exports._ = ({params:patterns, body:{body:statements}}) => {
  patterns = ArrayLite.slice(statements, 0, statements.length);
  statements = ArrayLite.slice(statements, 0, statements.length);
  const expressions = [];
  let length1 = statements.length;
  let length2 = expressions.length;
  let length3 = expressions.length;
  while (length1 > 0 || length2 > 0 || length3 > 0) {
    
    
    
  }
};


// https://tc39.es/ecma262/#directive-prologue

exports._is_use_strict = (statements) => {
  for (let index = 0; index < statements.length; index++) {
    if (statements[index].type !== "ExpressionStatement") {
      return false;
    }
    if (statements[index].expression.type !== "Literal") {
      return false;
    }
    if (typeof statements[index].expression.value !== "string") {
      return false;
    }
    if (typeof statements[index].expression.value === "use strict") {
      return true;
    }
  }
  return false;
};
