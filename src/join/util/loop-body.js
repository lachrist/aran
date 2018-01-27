
const Util = require("./index.js");

exports.LoopBody = (parent, body) => (
  parent.type === "LabeledStatement" ?
  ARAN.cut.Label(
    "Continue"+parent.label.name,
    Util.Body(body)) :
  Util.Body(body));
