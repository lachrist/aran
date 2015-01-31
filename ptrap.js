
var Ptah = require("./ptah.js")
var Util = require("./util.js")

module.exports = function (aran) {
  
  function trap (name, args) { return Ptah.call(Ptah.member(Ptah.member(Ptah.identifier("aran"), "traps"), name), args) }  

  return {
    primitive:  aran.traps.primitive  ? function (x) { return trap("primitive", [x]) }                              : Util.identity,
    function:   aran.traps.function   ? function (x) { return trap("function", [x]) }                               : Util.identity,
    arguments:  aran.traps.arguments  ? function (x) { return trap("arguments", [x]) }                              : Util.identity,
    object:     aran.traps.object     ? function (x) { return trap("object", [x]) }                                 : Util.identity,
    array:      aran.traps.array      ? function (x) { return trap("array", [x]) }                                  : Util.identity,
    regexp:     aran.traps.regexp     ? function (x) { return trap("regexp", [x]) }                                 : Util.identity,
    booleanize: aran.traps.booleanize ? function (x, test) { return trap("booleanize", [Ptah.literal(test), x]) }   : Util.identity,
    stringify:  aran.traps.stringify  ? function (xs) { return trap("stringify", xs) }                              : function (xs) { return xs[0] },
    throw:      aran.traps.throw      ? function (x) { return trap("throw", [x]) }                                  : Util.identity,
    catch:      aran.traps.catch      ? function (x) { return trap("catch", [x]) }                                  : Util.identity,
    get:        aran.traps.get        ? function (o, p) { return trap("get", [o, p]) }                              : Ptah.member,
    unary:      aran.traps.unary      ? function (op, x) { return trap("unary", [Ptah.literal(op), x]) }            : Ptah.unary,
    binary:     aran.traps.binary     ? function (op, x1, x2) { return trap("binary", [Ptah.literal(op), x1, x2]) } : Ptah.binary,
    new:        aran.traps.new        ? function (f, xs) { return trap("new", [f, Ptah.array(xs)]) }                : Ptah.new,
    set:        aran.traps.set        ? function (o, p, v) { return trap("set", [o, p, v]) }                        : function set (o, p, v) { return Ptah.assignment(Ptah.member(o, p), v) },
    delete:     aran.traps.delete     ? function (o, p) { return trap("delete", [o, p]) }                           : function del (o, p) { return Ptah.unary("delete", Ptah.member(o, p)) },
    erase:      aran.traps.erase      ? function (x, name) { return trap("erase", [Ptah.literal(name), x]) }        : Util.identity,
    apply: function (f, o, xs) { return trap("apply", [f, o, Ptah.array(xs)]) },
    enumerate: function (o) { return trap("enumerate", [o]) }
  }

}








  // var wrap       = aran.traps.wrap       ? function (x) { return trap("wrap", [x]) }       : identity
  // var object     = aran.traps.object     ? function (x) { return trap("object", []) }      : function () { return {type:"ObjectExpression", properties:[]} }
  //  var object     = aran.traps.object     ? function (x) { return trap("object", []) }      : function () { return {type:"ObjectExpression", properties:[]} }
  // var booleanize = aran.traps.booleanize ? function (x) { return trap("booleanize", [x]) } : identity
  // var stringify  = aran.traps.stringify  ? function (x) { return trap("stringify", [x]) }  : identity

  // var o = {wrap:wrap, booleanize:booleanize, stringify:stringify}

  // if (aran.traps.get) { o.get = function (o, k) { return trap("get", [o, k]) } }
  // else { o.get = function (o, k) { return exports.member(o, stringify(k)) } }

  // if (aran.traps.set) { o.set = function (o, k) { return trap("set", [o, k, v]) } }
  // else { o.set = function (o, k) { return exports.assignment(exports.member(o, stringify(k)), v) } }

  // if (aran.traps.unary) { o.unary = function (op, arg) { return trap("unary", [o, k, v]) } }
  // else { o.unary = function (op, arg) { return wrap(exports.unary(op, unwrap(arg))) } }

  // if (aran.traps.delete) { o.delete = function (o, k) { return trap("delete", [o, k])} }
  // else { o.delete = function (o, k) { return wrap(exports.unary("delete", exports.member(unwrap(o), unwrap(k)))) } }

  // if (aran.traps.binary) { o.binary = function (op, arg1, arg2) { return trap("binary", [op, arg1, arg2]) } }
  // else { o.binary = function (op, arg1, arg2) { return wrap(exports.binary(op, unwrap(arg1), unwrap(arg2))) } }

  // if (aran.traps.apply) { o.apply = function (fct, th, args) { return trap("apply", [fct, th, args] )}}
  // else { o.apply = function (fct, th, args) { return exports.call(shadow("apply"), [fct, th, args]) } }

  // if (aran.traps.construct) { o.construct = function (fct, args) { return trap("construct", [fct, args] )}}
  // else { o.construct = function (fct, args) { return exports.new(shadow(fct, args) } }

