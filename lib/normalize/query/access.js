
"use strict";

const Other = require("./other.js");

const global_Error = global.Error;

// type Access = Int
// type Scoping = Maybe Bool
// type CalleeIdentifier = Maybe Identifier

const NO_SCOPING = null;
const BLOCK_SCOPING = false;
const CLOSURE_SCOPING = true;

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

let callee_identifier = null;

exports._access = (node) => {
  if (node.type !== "FunctionExpression" && node.type !== "FunctionDeclaration") {
    throw new global_Error("Invalid input node");
  }
  let access = EMPTY;
  if (node.id !== null) {
    callee_identifier = node.id.name;
  }
  for (let index = 0; index < node.params.length; index++) {
    if (node.params[index].type === "RestElement") {
      access = combine(access, visit_pattern(node.params[index].argument, ARGUMENTS_CLOSURE_DECLARATION));
    } else {
      access = combine(access, visit_pattern(node.params[index], ARGUMENTS_CLOSURE_DECLARATION));
    }
  }
  access = combine(access, visit_block(node.body));
  // access = remove_closure_declaration(access);
  callee_identifier = null;
  return {
    is_this_read: access % THIS_READ === 0,
    is_new_target_read: access % NEW_TARGET_READ === 0,
    is_arguments_read: access % ARGUMENTS_READ === 0,
    is_arguments_written: access % ARGUMENTS_WRITE === 0,
    is_callee_read: access % CALLEE_READ === 0,
    is_callee_written: access % CALLEE_WRITE === 0
  };
};

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

const visit_pattern = (pattern, scoping) => {
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
        access = combine(access, visit_pattern(pattern.properties[index].value, scoping));
      }
    }
    return access;
  }
  // console.assert(pattern.type === "Identifier");
  // callee takes precedence: `function arguments () { arguments }`
  if (callee_identifier !== null && pattern.name === callee_identifier) {
    if (scoping === null) {
      return CALLEE_WRITE;
    }
    return scoping ? CALLEE_CLOSURE_DECLARATION : CALLEE_BLOCK_DECLARATION;
  }
  if (pattern.name === "arguments") {
    if (scoping === null) {
      return ARGUMENTS_WRITE;
    }
    return scoping ? ARGUMENTS_CLOSURE_DECLARATION : ARGUMENTS_BLOCK_DECLARATION;
  }
  return EMPTY;
};

const visit_expression = (expression) => {
  // Primitive //
  if (expression.type === "Literal") {
    return EMPTY;
  }
  // Environment //
  if (expression.type === "Identifier") {
    // callee takes precedence: `function arguments () { return arguments }``
    if (callee_identifier !== null && expression.name === callee_identifier) {
      return CALLEE_READ;
    }
    if (expression.name === "arguments") {
      return ARGUMENTS_READ;
    }
    return EMPTY;
  }
  if (expression.type === "ThisExpression") {
    return THIS_READ;
  }
  if (expression.type === "MetaProperty") {
    console.assert(expression.meta.name === "new" && expression.property.name === "target");
    return NEW_TARGET_READ;
    // if (expression.meta.name === "new" && expression.property.name === "target") {
    //   return NEW_TARGET_READ;
    // }
    // // console.assert(expression.meta.name === "import" && expression.property.name === "meta");
    // return EMPTY;
  }
  if (expression.type === "UpdateExpression") {
    return visit_pattern(expression.argument, NO_SCOPING);
  }
  if (expression.type ===  "AssignmentExpression") {
    return combine(visit_pattern(expression.left, NO_SCOPING), visit_expression(expression.right));
  }
  // Control-Flow //
  if (expression.type ===  "SequenceExpression") {
    let access = EMPTY;
    for (let index = 0; index < expression.expressions.length; index++) {
      access = combine(access, visit_expression(expression.expressions[index]));
    }
    return access;
  }
  if (expression.type === "LogicalExpression") {
    return combine(visit_expression(expression.left), visit_expression(expression.right));
  }
  if (expression.type === "ConditionalExpression") {
    return combine(visit_expression(expression.test), combine(visit_expression(expression.consequent), visit_expression(expression.alternate)))
  }
  // Operator //
  if (expression.type === "YieldExpression" || expression.type === "AwaitExpression" || expression.type === "UnaryExpression") {
     // Could be optimized for UnaryExpression with operator `void` or `delete`
    return visit_expression(expression.argument);
  }
  if (expression.type === "BinaryExpression") {
    return combine(visit_expression(expression.left), visit_expression(expression.right));
  }
  if (expression.type === "MemberExpression") {
    let access = visit_expression(expression.object);
    if (expression.computed) {
      access = combine(access, visit_expression(expression.property));
    }
    return access;
  }
  // Construction //
  if (expression.type === "ClassExpression") {
    let access = EMPTY;
    if (expression.id !== null) {
      access = visit_pattern(expression.id, BLOCK_SCOPING);
    }
    if (expression.superClass !== null) {
      access = combine(access, visit_expression(expression.superClass));
    }
    for (let index = 0; index < expression.body.body.length; index++) {
      if (expression.body.body[index].computed) {
        access = combine(access, visit_expression(expression.body.body[index].key));
      }
    }
    return remove_block_declaration(access);
  }
  if (expression.type === "TemplateLiteral") {
    let access = EMPTY;
    for (let index = 0; index < expression.expressions.length; index++) {
      access = combine(access, visit_expression(expression.expressions[index]));
    }
    return access;
  }
  if (expression.type === "TaggedTemplateExpression") {
    return combine(visit_expression(expression.tag), visit_expression(expression.quasi));
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
    // If we enters functions, this algorithm becomes quadratic //
    return CALLEE_READ * CALLEE_WRITE;
  }
  if (expression.type === "ArrowFunctionExpression") {
    let access = EMPTY;
    for (let index = 0; index < expression.params.length; index++) {
      access = combine(access, visit_pattern(expression.params[index], CLOSURE_SCOPING));
    }
    if (expression.expression) {
      access = combine(access, visit_expression(expression.body));
    } else {
      access = combine(access, visit_statement(expression.body));
    }
    return remove_closure_declaration(access);
  }
  // Application //
  if (Other._is_direct_eval_call(expression)) {
    return ARGUMENTS_READ * ARGUMENTS_WRITE * CALLEE_READ * CALLEE_WRITE * THIS_READ * NEW_TARGET_READ;
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
  // console.assert(expression.type === "ImportExpression")
  throw new global_Error("Invalid expression type");
};

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
  if (statement.type === "ExpressionStatement") {
    return visit_expression(statement.expression);
  }
  if (statement.type === "BlockStatement") {
    return visit_block(statement);
  }
  if (statement.type === "LabeledStatement") {
    return visit_statement(statement.body);
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
  if (statement.type === "SwitchStatement") {
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
  if (statement.type === "ReturnStatement") {
    return statement.argument === null ? EMPTY : visit_expression(statement.argument);
  }
  if (statement.type === "ThrowStatement") {
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
        access1 = combine(access1, visit_block(statement.handler.body));
      }
    }
    if (statement.finalizer !== null) {
      access1 = combine(access1, visit_block(statement.finalizer));
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
      access = combine(access, visit_expression(statement.test));
    }
    if (statement.update !== null) {
      access = combine(access, visit_expression(statement.update));
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
      access = combine(access, visit_pattern(statement.left, NO_SCOPING));
    }
    access = combine(access, visit_expression(statement.right));
    access = combine(access, visit_statement(statement.body));
    return remove_block_declaration(access);
  }
  if (statement.type === "FunctionDeclaration") {
    // If we enters functions, this algorithm becomes quadratic //
    return combine(CALLEE_READ * CALLEE_WRITE, visit_pattern(statement.id, CLOSURE_SCOPING));
  }
  if (statement.type === "ClassDeclaration") {
    let access = visit_pattern(statement.id, BLOCK_SCOPING);
    if (statement.superClass !== null) {
      access = combine(access, visit_expression(statement.superClass));
    }
    for (let index = 0; index < statement.body.body.length; index++) {
      if (statement.body.body[index].computed) {
        access = combine(access, visit_expression(statement.body.body[index].key));
      }
    }
    return access;
  }
  if (statement.type === "VariableDeclaration") {
    let access = EMPTY;
    const scoping = statement.kind === "var" ? CLOSURE_SCOPING : BLOCK_SCOPING;
    for (let index = 0; index < statement.declarations.length; index++) {
      access = combine(access, visit_pattern(statement.declarations[index].id, scoping));
      if (statement.declarations[index].init !== null) {
        access = combine(access, visit_expression(statement.declarations[index].init));
      }
    }
    return access;
  }
  // console.assert(false);
  throw new global_Error("Invalid statement type");
};
