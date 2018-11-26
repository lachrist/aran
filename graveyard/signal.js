
exports.throw = (string1, string2) => ARAN.cut.apply(
  ARAN.cut.closure(
    null,
    ARAN.cut.Throw(
      ARAN.cut.construct(
        ARAN.cut.builtin(string1),
        [
          ARAN.cut.primitive(string2)]))),
  ARAN.cut.primitive(void 0),
  []);
