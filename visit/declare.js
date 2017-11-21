
module.exports = (ast, idx) => ast.declarations.map(
  (dec) => dec.init ?
    Assign(ast.kind, dec.id, dec.init, idx) :
    ARAN_CUT.Declare(
      ast.kind,
      dec.id.name,
      ARAN_CUT.primitive(void 0, idx),
      idx));
