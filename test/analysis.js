(function () {
  var asts = [];
  this.gruntyyy = {};
  this.gruntyyy.apply = function (fct, ths, args, idx) {
    console.log("APPLY >>> " + idx);
    return fct.apply(ths, args);
  };
  this.gruntyyy.Ast = function (ast, url) {
    asts.push(ast);
    console.log("SWAAAAAG >>> " + url);
  };
} ());