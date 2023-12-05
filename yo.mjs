const o = { __proto__: { qux: 789 }, foo: 123, bar: 456 };

for (const k in o) {
  console.log({ k });
  Reflect.defineProperty(o, "bar", { enumerable: false });
  console.log(Reflect.getOwnPropertyDescriptor(o, "bar"));
}
