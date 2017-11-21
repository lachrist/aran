
const Strict = require("./strict.js")

module.exports = (ast) => {
  const tmp1 = ARAN_HOISTED;
  const tmp2 = ARAN_STRICT;
  ARAN_HOISTED = [];
  ARAN_STRICT = Strict(ast.body.body[0]);
  const res = Build.function(
    ast.id ? ast.id.name : null,
    [],
    []);
  ARAN_HOISTED = tmp1;
  ARAN_STRICT = tmp2;
};
