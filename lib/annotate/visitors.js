
////////////////
// Expression //
////////////////

exports.Identifier = (node, context) => {
  if (node.name === "arguments")
    context()
  return ;
};

exports.MemberExpression = (node, context) => {
  Visit(node.object, node, context);
  if (node.computed) {
    Visit(node.property, node, context);
  }
};

exports.AssignmentExpression = (node, context) => {

};

exports.

exports.Arguments

///////////////
// Statement //
///////////////

exports.BlockStatement = (node, context) => {
  
};
