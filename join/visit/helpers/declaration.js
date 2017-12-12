
const Assignment = require("./assignment.js");
const concat = Array.prototype.concat

module.exports = (declaration) => concat.apply(
  [],
  declaration.declarations.map((declarator) => {
    if (declarator.init)
      return Assignment(declaration.kind, declarator.id, declarator.init);
    if (declarator.id.type !== "Identifier")
      throw new Error("Missing initializer in destructuring pattern");
    const statement = ARAN.cut.Declare(
      declaration.kind,
      declarator.id.name,
      ARAN.cut.primitive(void 0));
    if (kind !== "var")
      return [statement];
    ARAN.closure.hoisted.push(statement);
    return [];
  }));
