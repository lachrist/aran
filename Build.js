const stringify = JSON.stringify;

exports.conditional = (tst, csq, alt) => "(" + tst + "?" + csq + ":" + alt + ")";

exports.binary = (opr, lft, rgt) => "(" + lft + " " + opr + " " + rgt + ")";

exports.sequence = (exps) => "(" + exps.join(",") + ")";

exports.primitive = (val) => val === void 0 ?
  "(void 0)" :
  typeof val === "string" ?
    stringify(val) :
    String(val);

exports.statement = (exp) => exp + ";"

exports.array = (exps) => "[" + exps.join(",") + "]";

exports.Empty = () => ";"