module.exports = (left, update) => left.type === "Identifier" ?
  ARAN.cut.write(
    left.name,
    update(
      ARAN.cut.read(left.name))) :
  ARAN.cut.set(
    Build.write(
      Hide("object"),
      Visit.expression(left.object)),
    Build.write(
      Hide("property"),
      Property(left.property)),
    update(
      ARAN.cut.get(
        ARAN.cut.copy1.before(
          Build.read(
            Hide("object"))),
        ARAN.cut.copy1.before(
          Build.read(
            Hide("property"))))));
