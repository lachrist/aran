"use strict";
const toArgumentList = (
  (
    descriptor,
    default_callee_descriptor,
    {
      Reflect: { defineProperty: defineProperty },
      Array: {
        prototype: { values: values },
      },
      Symbol: { iterator: iterator, toStringTag: toStringTag },
    },
  ) =>
  (array, callee) => {
    console.log({ default_callee_descriptor });
    const list = {},
      length = array.length;
    let index = 0;
    while (index < length) {
      defineProperty(
        list,
        index,
        ((descriptor.value = array[index]), descriptor),
      );
      index = index + 1;
    }
    descriptor.enumerable = false;
    defineProperty(list, "length", ((descriptor.value = length), descriptor));
    defineProperty(
      list,
      "callee",
      callee
        ? ((descriptor.value = callee), descriptor)
        : default_callee_descriptor,
    );
    defineProperty(list, iterator, ((descriptor.value = values), descriptor));
    defineProperty(
      list,
      toStringTag,
      ((descriptor.value = "Arguments"), descriptor),
    );
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
  globalThis.Reflect.getOwnPropertyDescriptor(
    globalThis.Function.prototype,
    "arguments",
  ),
  globalThis,
);

console.log(toArgumentList([1, 2, 3], null));
