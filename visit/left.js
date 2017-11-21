module.exports = (fct, lft, idx) => {
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
};