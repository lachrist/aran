
const Assignment = require("./assignment.js");
const concat = Array.prototype.concat

module.exports = (kind, declarators) => concat.apply(
  [],
  declarators.map((declarator) => {
    if (declarator.init)
      return Assignment(
        kind,
        [
          [declarator.id, declarator.init]]);
    if (declarator.id.type !== "Identifier")
      throw new Error("Missing initializer in destructuring pattern");
    const statements = ARAN.cut.Declare(
      kind,
      declarator.id.name,
      ARAN.cut.primitive(void 0));
    if (kind !== "var")
      return statements;
    ARAN.closure.hoisted.push(statements);
    return [];
  }));
