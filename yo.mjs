Lang._match_block(Meta.EXTEND_STATIC(Meta._make_root(), [], (scope) => {
  return Meta.ImportBox(scope, "x", "foobar", (box) => {
    Asser.throws(() => Meta.set(scope, box, Tree.primitive(123)), new global.Error("Cannot set a constant box"));
    return Tree.Lift(Meta.get(scope, box)),
  });
}), Lang.PARSE_BLOCK(`{
  let $_x_1_1;
  import * as $_x_1_1 fro "foobar";
  $_x_1_1;
}`), Assert);
