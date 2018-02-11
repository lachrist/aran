
const ArrayLite = require("array-lite");
const Visit = require("../visit");
const Util = require("./index.js");

exports.Loop = (test, before, body, after) => {
  const temporay1 = ARAN.break;
  const temporay2 = ARAN.continue;
  ARAN.break = "B" + ARAN.parent.AranSerial;
  ARAN.continue = "C" + ARAN.parent.AranSerial;
  const result = ARAN.cut.Label(
    ARAN.break,
    ARAN.cut.While(
      (
        test ||
        ARAN.cut.primitive(true)),
      ArrayLite.concat(
        before,
        ARAN.cut.Label(
          ARAN.continue,
          (
            ARAN.parent.AranParent.type === "LabeledStatement" ?
            ARAN.cut.Label(
              "c" + ARAN.parent.AranParent.label.name,
              Util.Body(body)) :
            Util.Body(body))),
        after)));
  ARAN.break = temporay1;
  ARAN.continue = temporay2;
  return result;
};
