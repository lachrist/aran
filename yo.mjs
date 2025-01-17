{
  const rec = {};
  const Error = globalThis.Error;
  const errors = [];
  Object.defineProperty(rec, "foo", {
    get() {
      errors.push(new Error("WESH"));
    },
  });
  Reflect.apply(Reflect.get, undefined, [rec, "foo"]);
  console.dir(errors);
}
