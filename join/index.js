
const Cut = require("./cut");
const VisitProgram = require("./visit-program");

module.exports = (program, pointcut) => {
  ARAN.cut = Cut(pointcut);
  return VisitProgram(program);
};
