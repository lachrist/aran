console.log(
  ((f) => {
    const record = {};
    record.outer_before = f;
    {
      record.inner_before = f;
      function f() {}
      record.inner_after = f;
    }
    record.outer_after = f;
    return record;
  })(123),
);

console.log(
  (() => {
    const record = {};
    record.outer_before = f;
    {
      record.inner_before = f;
      function f() {}
      record.inner_after = f;
    }
    record.outer_after = f;
    return record;
  })(),
);
