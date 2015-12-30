
// Idem as 2-Transparent but logs everything as well //

(function () {

  aran.traps = {};

  Object.keys(aran.forwards).forEach(function (k) {
    aran.traps[k] = function () {
      log(k, arguments);
      return aran.forwards[k].apply(null, arguments);
    };
  });

  var ast = null;
  aran.traps.ast = function (x, i) { ast = x };

  function log (trap, xs) {
    var n = aran.fetch(ast, xs[xs.length-1]);
    var s = trap+" "+n.type+"@"+n.loc.start.line+"-"+n.loc.start.column;
    for (var i=0; i<xs.length-1; i++)
      s += (typeof xs[i] === "function") ? " [function "+xs[i].name+"]" : " "+String(xs[i]);
    console.log(s);
  }

} ());