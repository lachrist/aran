
const Flaten = require("../../flaten.js");
const Visit = require("../index.js");

module.exports = (statement) => statement.type === "BlockStatement" ?
  Flaten.apply(
    null,
    statement.body.map(Visit.Statement)) :
  Visit.Statement(statement);
