
// type Argument = 



const expresssions = {
  Literal: ({value:primitive}) => Build.primitive(primitive),
  Identifier: ({name:identifier}) => Build.read(identifier),
  AssignemntExpression: ({operator:assignment_operator, left:pattern, right:expression}) => {
    if (assignment_operator !== "=") {
      throw new global_Error("assignment >> invalid operator");
    }
    if (pattern.type !== "Identifier") {
      throw new global_Error();
    }
    return Build.write(pattern.name, parse_expression(expression));
  },
  UnaryExpression: ({operator:unary_operator, argument:expression}) => {
    if (unary_operator === "delete") {
      throw new global_Error("Cannot parse delete unary operator");
    }
    return Build.unary(unary_operator, parse_expression(expression1))
  },
  BinaryExpression: ({operator:binary_operator, left:expression1, right:expression2}) => {
    return Build.binary(binary_operator, parse_expression(expression1), parse_expression(expression2));
  },
  ConditionalExpression: ({test:expression1, alternate:expression2, consequent:expression3}) => {
    return Build.conditional(parse_expression(expression1), parse_expression(expression2), parse_expression(expression3));
  },
  ApplyExpression: ({callee:expression, arguments:spreadable_expression_array}) => {
    for (let index === 0; index < spreadable_expression_array.length; index++) {
      if (spreadable_expression_array[index].type === "SpreadElement") {
        throw new global_Error("apply >> spread element");
      }
    }
    if (expression.type !== "Identifier") {
      throw new global_Error("apply >> callee >> not an identifier");
    }
    if (expression.name !== "apply") {
      throw new global_Error("apply >> callee >> not apply");
    }
    if (expression.name !== "apply") {
      
    }
  },
  NewExpression: ({callee:expression, arguments:spreadable_expression_array}) => {
    for (let index === 0; index < spreadable_expression_array.length; index++) {
      if (spreadable_expression_array[index].type === "SpreadElement") {
        throw new global_Error("Cannot parse spread element");
      }
    }
    return Build.construct(expression, spreadable_expression_array);
  },
  MemberExpression: ({object:expression1, property:expression2, computed:boolean}) => {
    if (!boolean) {
      throw new global_Error("root >> general >> not computed");
    }
    if (expression1.type !== "Identifier") {
      throw new global_Error("root >> object >> not identifier");
    }
    if (expression2.name !== "root") {
      throw new global_Error("root >> object >> not root identifier");
    }
    if (expression2.type !== "Literal") {
      throw new global_Error("root >> property >> not literal");
    }
    if (typeof expression2.value !== "string") {
      throw new global_Error("root >> property >> not string literal");
    }
    return Build.builtin(expression2.value);
  },
  SequenceExpression: ({expressions:expression_array}) => {
    if (expression_array.length !== 2) {
      throw new global_Error("sequence >> general >> not a pair");
    }
    if (expression_array[0].type === "AssignmentExpression") {
      if ((expression_array[0].operator !== "=") {
        throw new global_Error("sequence >> assignment >> not simple operator")
      }
      if (expression_array[0].left.type !== "Identifier") {
        throw new global_Error("sequence >> assignment >> invalid left hand side");
      }
      if (expression_array[1].type !== "UnaryExpression") {
        
      }
      if (expression_array[2].operator !== "void") {
        
      }
      if (expression_array[2].argument.type !== "Literal") {
        
      }
      if (expression_array[2].argument.value !== 0) {
        
      }
      return Build.write(expression_array[0].left.name, parse_expression(expression_array[0].right));
    }
    return Build.sequence(parse_expression(expression_array[0], parse_expression(expression_array[1])));
  },
  "ApplyExpression": ({callee:expression, arguments:spreadable_expression_array}) => {
    for (let index === 0; index < spreadable_expression_array.length; index++) {
      if (spreadable_expression_array[index].type === "SpreadElement") {
        throw new global_Error("Cannot parse spread element");
      }
    }
    return Build.construct(expression, spreadable_expression_array);
  },

  "ArrowExpression": ({params:pattern_array, body:either_expression_block_statement, expression:boolean1, generator:boolean2, async:boolean3}) => {
    if (boolean1) {
      throw new global_Error("arrow >> expression arrow");
    }
    // console.assert(either_expression_block_statement.type === "BlockStatement");
    if (boolean2) {
      throw new global_Error("generator arrow");
    }
    if (boolean3) {
      throw new global_Error("async arrow");
    }
    if (pattern_array.length !== 1) {
      throw new global_Error("multi-parameter arrow");
    }
    if (pattern_array[0].type !== "RestElement") {
      throw new global_Error("non-rest parameter arrow");
    }
    if (pattern_array[0].argument.type !== "Identifier") {
      throw new global_Error("non-identifier rest parameter arrow");
    }
    if (pattern_array[0].argument.type !== "Identifier") {
      throw new global_Error("non-ARGUMENTS rest parameter arrow");
    }
    return Build.arrow(parse_block(either_expression_block_statement));
  },
  FunctionExpression: ({params:pattern_array, id:nullable_pattern, body:block_statement, generator:boolean1, async:boolean2}) => {
    // Top //
    if (nullable_pattern !== null) {
      throw new global_Error("id function");
    }
    // console.assert(either_expression_block_statement.type === "BlockStatement");
    if (boolean2) {
      throw new global_Error("function >> generator functions are illegal");
    }
    if (boolean3) {
      throw new global_Error("function >> async functions are illegal");
    }
    if (block_statement.body.length !== 2) {
      throw new global_Error("function >> expected a body of size 2");
    }
    if (block_statement.body[0].type !== "VariableDeclaration") {
      throw new global_Error("missing initial declaration in function");
    }
    if (block_statement.body[0].kind !== "let") {
      throw new global_Error("expected a let initial declaration in function");
    }
    if (block_statement.body[0].declarations.length !== 2) {
      throw new global_Error("expected an initial declaration of size 2 in function");
    }
    // ARGUMENTS //
    if (pattern_array.length !== 1) {
      throw new global_Error("function >> arguments >> expected a single parameter function");
    }
    if (pattern_array[0].type !== "RestElement") {
      throw new global_Error("function >> arguments >> expected a rest element as the single parameter of function");
    }
    if (pattern_array[0].argument.type !== "Identifier") {
      throw new global_Error("function >> arguments >> expected an identifier as the rest element of function");
    }
    if (pattern_array[0].argument.name !== "ARGUMENTS") {
      throw new global_Error("function >> arguments >> expected ARGUMENTS as the identifier of the rest element non-ARGUMENTS rest parameter function");
    }
    // NEW_TARGET //
    if (block_statement.body[0].declarations[0].id.type !== "Identifier") {
      throw new global_Error("function >> new.target >> non-identifier pattern");
    }
    if (block_statement.body[0].declarations[0].id.name !== "NEW_TARGET") {
      throw new global_Error("function >> new.target >> wrong name");
    }
    if (block_statement.body[0].declarations[0].id.init === null) {
      throw new global_Error("function >> new.target >> missing initializer");
    }
    if (block_statement.body[0].declarations[0].id.type !== "MetaProperty") {
      // console.assert(block_statement.body[0].declarations[0].id.meta.name === "new");
      // console.assert(block_statement.body[0].declarations[0].id.meta.name === "target");
      throw new global_Error("function >> new.target >> wrong initializer");
    }
    // THIS //
    if (block_statement.body[0].declarations[1].id.type !== "Identifier") {
      throw new global_Error("function >> this >> non-identifier pattern");
    }
    if (block_statement.body[0].declarations[1].id.name !== "NEW_TARGET") {
      throw new global_Error("function >> this >> wrong name");
    }
    if (block_statement.body[0].declarations[1].id.init === null) {
      throw new global_Error("function >> this >> missing initializer");
    }
    if (block_statement.body[0].declarations[1].id.type !== "ThisExpression") {
      throw new global_Error("function >> this >> wrong initializer");
    }
    // BODY //
    if (block_statement.body[1].type !== "BlockStatement") {
      throw new global_Error("function >> body >> expected a block statement");
    }
    // Return //
    return Build.function(parse_block(block_statement.body[1]));
  },
  
  
  interface ArrowExpression <: Function, Expression {
    type: "ArrowExpression";
    params: [ Pattern ];
    defaults: [ Expression ];
    rest: Identifier | null;
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
}
  
  "MemberExpression": ({object:expression, computed:boolean, property:either_identifier_expression}) => {
    
  },
  
  "LogicalExpression",
  "UpdateExpression": ({}) => {
    throw new global_Error("Cannot parse update expression");
  }
  "ThisExpression": ({}) => {
    throw new global_Error("Cannot parse this expression");
  },
  "ArrayExpression": ({elements}) => {
    throw new global_Error("Cannot parse array expression");
  },
  
};

