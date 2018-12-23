try {
  let _1, $f, _this;
  __ARAN__.arrival((void 0), (void 0), __ARAN__.builtins["global"], (void 0), 1);
  __ARAN__.enter("program", [], [
    1,
    "f",
    "this"], 1);
  _this = __ARAN__.write(__ARAN__.builtin(__ARAN__.builtins["global"], "global", 1), "this", 1);
  $f = __ARAN__.write(__ARAN__.apply(
    __ARAN__.builtin(__ARAN__.builtins["AranDefineDataProperty"], "AranDefineDataProperty", 3),
    __ARAN__.primitive((void 0), 3),
    [
      __ARAN__.apply(
        __ARAN__.builtin(__ARAN__.builtins["AranDefineDataProperty"], "AranDefineDataProperty", 3),
        __ARAN__.primitive((void 0), 3),
        [
          (
            _1 = __ARAN__.write(__ARAN__.primitive((void 0), 3), 1, 3),
            __ARAN__.apply(
              __ARAN__.builtin(__ARAN__.builtins["AranThrowTypeError"], "AranThrowTypeError", 3),
              __ARAN__.primitive((void 0), 3),
              [
                __ARAN__.primitive("Assignment to a constant variable", 3)])),
          __ARAN__.primitive("length", 3),
          __ARAN__.primitive(0, 3),
          __ARAN__.primitive(false, 3),
          __ARAN__.primitive(false, 3),
          __ARAN__.primitive(true, 3)]),
      __ARAN__.primitive("name", 3),
      __ARAN__.primitive("f", 3),
      __ARAN__.primitive(false, 3),
      __ARAN__.primitive(false, 3),
      __ARAN__.primitive(true, 3)]), "f", 2);
  __ARAN__.return(__ARAN__.apply(
    __ARAN__.read($f, "f", 35),
    __ARAN__.primitive((void 0), 34),
    [
      __ARAN__.primitive("foo", 36),
      __ARAN__.primitive("bar", 37)]), 1);
} catch (error) {
  throw __ARAN__.abrupt(error, 1);
} finally {
}
