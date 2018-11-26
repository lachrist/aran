

exports.object = (expression) => Build.apply(
  Build.builtin("Object"),
  Build.primitive(void 0),
  [expression]);

exports.array = (expressions) => Build.apply(
  Build.builtin("Array.of"),
  Build.primitive(void 0),
  expressions);

exports.concat = (expressions) => Build.apply(
  Build.builtin("Array.prototype.concat"),
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    []),
  expressions);
