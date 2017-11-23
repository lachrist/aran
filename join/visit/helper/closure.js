
// function (x) { ... }

// function () {
//   var aran_this = this;
//   var aran_arguments = arguments;
//   Closure(this, arguments);
//   x = write("x", aran_arguments[0]);
//   ...
// }

function (x, ...xs) { ... }

// (x) => { ... }

// function (aran_arg0) {
//   Closure(null, arguments);
//   x = write("x", aran_arg0);
//   ...
// }

(x, ...xs) => { ... }

function () {
  [x, ...xs] = arguments;
};



module.exports = (ast, idx) => {
  const tmp1 = ARAN_HOISTED;
  const tmp2 = ARAN_HIDDEN;
  const tmp2 = ARAN_STRICT;
  const str = ast.type === "ArrowExpression" ?
    Hide(idx, "arguments") :
    "arguments";
  ARAN_HOISTED = [];
  ARAN_STRICT = Strict(ast.body.type === "BlockStatement" && ast.body.body[0]);
  const arr = [];
  if (ARAN_STRICT)
    arr.push(
      Build.Statement(
        Build.primitive("use strict")));
  arr.push(
    Assign(
      "var",
      {type:"ArrayPattern", elements:ast.params},
      Build.identifier(str),
      idx),
    ARAN_CUT.Closure(ARAN_STRICT, ast.type === "ArrowExpression", str, idx));
  if (ast.body.type === "BlockStatement") {
    for (var i=0; i<ast.body.body.length; i++)
      Array.prototype.push.apply(arr, Visit(ast.body.body[i]));
    arr.push(
      Build.Return(
        ARAN_CUT.return(
          ARAN_CUT.primitive(void 0),
          idx))]);
  } else {
    arr.push(
      Build.Return(
        ARAN_CUT.return(
          Visit(ast.body),
          idx))])
  }
  Array.prototype.push.apply(arr, ARAN_HOISTED);
  const res = ast.type === "ArrowExpression" ?
    Build.arrow([], str, arr) :
    Build.Function(ast.id ? ast.id.name : null, [], null, arr);
  ARAN_HOISTED = tmp1;
  ARAN_STRICT = tmp2;
  return res;
};
