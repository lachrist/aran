
// Idem as 3-Trace.js but log with indentation that matches the callstack size //

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
  
  var depth = 0;
  aran.traps.apply = function (f, t, xs, i) {
    depth++;
    log("apply", arguments);
    var r = f.apply(t, xs);
    depth--;
    return r;
  };
  aran.traps.try = function (i) {
    log("try", arguments);
    var save = depth;
    aran.traps.catch = function (e, i) {
      log("catch", arguments);
      depth = save;
      return e;
    };
    aran.traps.finally = function (i) {
      log("finally", arguments);
      depth = save;
    };
  };

  function log (trap, xs) {
    var n = aran.fetch(ast, xs[xs.length-1]);
    var s = Array(depth+1).join("    ")+trap+" "+n.type+"@"+n.loc.start.line+"-"+n.loc.start.column;
    for (var i=0; i<xs.length-1; i++)
      s += (typeof xs[i] === "function") ? " [function "+xs[i].name+"]" : " "+String(xs[i]);
    console.log(s);
  }

} ());
