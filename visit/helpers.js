
const Visit = require("./index.js");

exports.property = (prp, idx) => prp.computed
  ? Visit(prp)
  : ARAN_CUT.primitive(prp[prp.type === "Identifier" ? "name" : "raw"], idx);

exports.body = (bdy) => bdy.type === "BlockStatement" ? Visit(bdy) : "{" + Visit(bdy) + "}";

// exports.loopbody = (bdy) => {
//   const tmp = ARAN_CONTEXT.label;
//   ARAN_CONTEXT.label = "";
//   const res = exports.body(bdy);
//   ARAN_CONTEXT.label = tmp;
//   return res;
// };

// function () {
//   var x;
//   x = apply(this["next"], this, []);
//   while (!x["done"]) (
//     arguments[0][arguments[0]["length"]] = x["value"],
//     x = apply(this["next"], this, [])
//   );
//   return arguments[0];
// }

const next = (nme, idx) => ARAN.CUT.apply(
  ARAN.get(nme, ARAN_CUT.primitive("next", idx), idx),
  nme,
  [],
  idx);

const rest = (idx) => {
  const str1 = ARAN_CUT.write("x", next("this", idx), idx);
  const str2 = ARAN_CUT.get(ARAN_CUT.read("arguments", idx), ARAN_CUT.primitive(0, idx), idx);
  return ARAN_CUT.function([
    "function(){",
    ARAN_CUT.Function(false, false, idx),
    ARAN_CUT.Declare("var", ["x"], idx),
    ARAN_CUT.statement(str1, idx),
    "while("+ARAN_CUT.test(
      ARAN_CUT.unary(
        "!",
        ARAN_CUT.get(
          ARAN_CUT.read("x", idx),
          ARAN_CUT.primitive("done", idx),
          idx),
        idx),
      idx)+")",
    ARAN_CUT.statement(ARAN_CUT.sequence([
      ARAN_CUT.set(
        str2,
        ARAN_CUT.get(
          str,
          ARAN_CUT.primitive("length", idx),
          idx),
        ARAN_CUT.get(
          ARAN_CUT.read("x"),
          ARAN_CUT.primitive("value", idx),
          idx),
        idx),
      str1
    ], idx), idx),
    "return "+ARAN_CUT.return(
      ARAN_CUT.get(
        ARAN_CUT.read("arguments", idx),
        ARAN_CUT.primitive(0, idx),
        idx),
      idx)+";"
  ].join(""), idx);
}

exports.declare = (ctx, src, ast) =>
  ast.kind + " " + ast.declarations.map((d) => d.id.name).join(",") + ";" + ast.declarations.map((dec) =>
    dec.init ? ctx.traps.expression(ctx.traps.write(dec.id.name, ctx.visit(src, dec.init), src.__min__), src.__min__) + ";" : "";
  ).join("");

exports.assign = (kind, left, right, index) => {
  if (!kind && left.type === "Identifier")
    return ARAN_CUT.write(left.name, right, index);
  if (!kind && left.type === "MemberExpression")
    return ARAN_CUT.set(Visit(left.object), right, index);
  const result = "";
  const pairs = [[left, kind ? right : ARAN_CUT.copy(right, 0, Hide("right", index), index)]];
  const sep = kind ? ";" : ",";
  let counter = 0;
  while (pairs.length) {
    counter++;
    [left, right] = pairs.pop();
    if (left === null) {
      result += right + sep + ARAN_CUT.drop(index) + sep;
    } else if (left.type === "Identifier") {
      result += kind
        ? ARAN_CUT.Declare(kind, left.name, right, index)
        : ARAN_CUT.write(left.name, right, index) + "," + ARAN_CUT.drop(index) + ",";
    } else if (left.type === "MemberExpression") {
      result +=
        (ARAN_CUT.set(Visit(left.object), property(left.property, index), right, index) + sep) +
        (ARAN_CUT.drop(index) + sep);
    } else if (left.type === "AssignmentPattern") {
      const hidden = ARAN_CONTEXT.hide(index, "test" + counter);
      pairs.push([
        left.left,
        ARAN_CUT.test(
          ARAN_CUT.binary(
            "===",
            ARAN_CUT.copy(right, 0, Hide("test" + counter, index), index),
            ARAN_CUT.primitive("void 0", index),
            index),
          index) + "?" + Hide("test" + counter, index) + ":" + Visit(left.right)
      ]);
    } else if (left.type === "ArrayPattern") {
      let length = left.elements.length;
      if (length && elements[length-1].type === "RestElement") {
        pairs.push([
          elements[length-1].argument,
          ARAN_CUT.apply(rest(index), ARAN_CUT.read(hidden, index), [ARAN_CUT.array([], index)]);
        ]);
        length--;
      }
      for (let i=length-1; i>=0; i--) {
        pairs.push([
          left.elements[i],
          ARAN_CUT.get(
            ARAN_CUT.apply(
              ARAN.get(
                Hide("iterator" + counter, index),
                ARAN_CUT.primitive("next", index),
                index),
              Hide("iterator" + counter, index),
              []
              index),
            ARAN_CUT.primitive("next", index),
            index)
        ]);
      }
      result += ARAN_CUT.copy(
        ARAN_CUT.apply(
          ARAN_CUT.get(
            ARAN_CUT.copy(right, Hide("this" + counter, index), 0, index),
            ARAN_CUT.read(Protect.load("iterator"), index),
            index),
          Hide("this" + counter, index),
          [],
          index),
        Hide("iterator" + counter, index),
        [0,1,2,3],
        index) + sep;
    } else if (left.type === "ObjectPattern") {
      const hidden = ARAN_CONTEXT.hide("object"+(++counter));
      expressions.push(ARAN_CUT)
      for (let i=left.properties.length-1; i>=0; i--) {
        pairs.push([

        ]);
      }
    }
  }
  return kind ? result : "(" result + Hide("right", index) + ")"
};

exports.left = (fct, lft, idx) => {
  if (lft.type === "Identifier")
    return ARAN_CUT.write(
      lft.name,
      fct(ARAN_CUT.read(lft.name, idx)),
      idx);
  if (lft.type !== "MemberExpression")
    throw new Error("Invalid left hand side: "+lft.type);
  ARAN_HOISTED += Build.Declaration(
    "var",
    Hide(idx, "object"),
    Hide(idx, "property"));
  return str = Build.sequence(
    ARAN_CUT.swapA(
      Build.sequence(
        Build.assign(
          Hide(idx, "object"),
          ARAN_CUT.copyA(
            Visit(lft.object),
            idx)),
        Build.assign(
          Hide(idx, "property"),
          ARAN_CUT.copyA(
            Helpers.property(lft.property, idx),
            idx))),
      1,
      2,
      idx),
    ARAN_CUT.set(
      Hide(idx, "object"),
      Hide(idx, "property"),
      fct(ARAN_CUT.get(
        Hide(idx, "object"),
        Hide(idx, "property"),
        idx)),
      idx));
}

exports["function"] = (ast) => {
  const tmp = ARAN_CONTEXT;
  ARAN_CONTEXT = Context(ast.body.body[0]);
  const arr = (ARAN_CONTEXT.strict ? ast.body.body.slice(1) : ast.body.body).map(Visit);
  var res = [
    " function " + (ast.id ? ast.id.name : "") + "(" +  + "){",
    (ARAN_CONTEXT.strict ? "'use strict';" : ""),
    ARAN_CUT.Function(ARAN_CONTEXT.strict, ast.params.every((prm) => prm.name !== "arguments"), ast.__min__),
    assignment("var", {
      type: ArrayPattern,
      elements: 
    }, )
    ARAN_CONTEXT.hoisted,
    arr.join(""),
    "return " + ARAN_CUT.return(ARAN_CUT.primitive("void 0", ast.__min__), ast.__min__) + ";",
    "}"
  ];
  ARAN_CONTEXT = tmp;
  return res;
};
