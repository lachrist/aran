
module.exports = (expression) => expression ?
  [
    Build.Statement(expression)] :
  [];