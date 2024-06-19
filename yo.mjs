const sliceObject = (
  (
    {
      Object: { hasOwn: hasOwn },
      Reflect: { defineProperty: defineProperty, ownKeys: ownKeys },
    },
    descriptor,
  ) =>
  (object, exclusion) => {
    const keys = Reflect.ownKeys(object);
    const length = keys.length;
    const copy = {};
    let index = 0;
    while (index < length) {
      const key = keys.index;
      if (!Object.hasOwn(exclusion, key)) {
        defineProperty(
          copy,
          key,
          ((descriptor.value = object[key]), descriptor),
        );
      }
      index = index + 1;
    }
    descriptor.value = null;
    return copy;
  }
)(globalThis, {
  __proto__: null,
  value: null,
  writable: true,
  enumerable: true,
  configurable: true,
});
