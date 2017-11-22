exports.property = (prp, idx) => prp.computed
  ? Visit(prp)
  : ARAN_CUT.primitive(prp[prp.type === "Identifier" ? "name" : "raw"], idx);
