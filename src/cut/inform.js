
module.exports = ($expression) => (
  $expression ?
  ARAN.build.Statement($expression) :
  []);
