
const Flaten = require("../../flaten.js");
const Visit = require("../index.js");

module.exports = (statement) => statement.type === "BlockStatement" ?
  Flaten(
    ARAN.cut.Enter("block"),
    Flaten(statement.body.map(Visit.Statement))
    ARAN.cut.Leave("block")),
  Visit.Statement(statement)
};
