const toArgumentList = (
  (
    descriptor,
    {
      Reflect: { defineProperty },
      Symbol: { iterator, toStringTag },
      Array: {
        prototype: { values },
      },
    },
    default_callee_descriptor,
  ) =>
  (array, callee) => {
    const list = {};
    const { length } = array;
    for (let index = 0; index < length; index++) {
      descriptor.value = array[index];
      defineProperty(list, index, descriptor);
    }
    descriptor.enumerable = false;
    descriptor.value = length;
    defineProperty(list, "length", descriptor);
    if (callee) {
      descriptor.value = callee;
      defineProperty(list, "callee", descriptor);
    } else {
      defineProperty(list, "callee", default_callee_descriptor);
    }
    descriptor.value = values;
    defineProperty(list, iterator, descriptor);
    descriptor.value = "Arguments";
    defineProperty(list, toStringTag, descriptor);
    descriptor.value = null;
    descriptor.enumerable = true;
    return list;
  }
)(
  {
    __proto__: null,
    value: null,
    writable: true,
    enumerable: true,
    configurable: true,
  },
  globalThis,
  globalThis.Reflect.getOwnPropertyDescriptor(
    globalThis.Function.prototype,
    "arguments",
  ),
);

console.log(toArgumentList([1, 2, 3], null));
