
const ArrayLite = require("array-lite");

exports.define = (expression1, string, expression2, boolean1, boolean2, boolean3) => ARAN.cut.apply(
  null,
  ARAN.cut.$builtin(["Object", "defineProperty"]),
  [
    expression1,
    ARAN.cut.primitive(string),
    ARAN.cut.object(
      ArrayLite.concat(
        [
          [
            ARAN.cut.primitive("value"),
            expression2]],
        (
          boolean1 ?
          [
            [
              ARAN.cut.primitive("writable"),
              ARAN.cut.primitive(true)]] :
          []),
        (
          boolean2 ?
          [
            [
              ARAN.cut.primitive("enumerable"),
              ARAN.cut.primitive(true)]] :
          []),
        (
          boolean3 ?
          [
            [
              ARAN.cut.primitive("configurable"),
              ARAN.cut.primitive(true)]] :
          [])))]);
