
exports.Block = (scope1, block, scope2, tokens) => (
  [tokens, scope2] = Scope.block(statements, scope);
  ARAN.cut.Block(
    ArrayLite.concat(
      ArrayLite.flatMap(
        tokens,
        (token) => ARAN.cut.Declare(
          token,
          ARAN.cut.primitive(false))),
      ArrayLite.flatMap(
        ArrayLite.filter(
          block.body,
          (statement) => statement.type === "FunctionDeclaration"),
        (statement) => Visit.Statement(scope2, statement)),
      ArrayLite.flatMap(
        ArrayLite.filter(
          block.body,
          (statement) => statement.type !== "FunctionDeclaration"),
        (statement) => Visit.Statement(scope2, statement)))));
