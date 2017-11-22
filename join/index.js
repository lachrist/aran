
const Cut = require("./cut");
const Visit = require("./visit");

module.exports = (root, pointcut) => {
  const temporary = global.ARAN_CUT;
  global.ARAN_CUT = Cut(pointcut);
  const result = Visit.PROGRAM(root);
  global.ARAN_CUT = temporary;
  return result;
};
