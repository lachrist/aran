function f() {
  const logs = [];
  logs.push({ outer: g });
  g = "before-outer";
  logs.push({ outer: g });
  const outer = () => g;
  {
    logs.push({ loc: "inner-initial", inner: g, outer: outer() });
    g = "before-block";
    logs.push({ loc: "inner-before-declaration", inner: g, outer: outer() });
    function g() {}
    logs.push({ loc: "inner-after-declaration", inner: g, outer: outer() });
    g = "after-block";
    logs.push({ loc: "inner-final", inner: g, outer: outer() });
  }
  logs.push({ outer: g });
  g = "after-closure";
  logs.push({ outer: g });
  return logs;
}

(() => {
  eval(`
    console.log('delete', delete g);
    { function g () {}; }
  `);
  console.log("g", g);
})();
