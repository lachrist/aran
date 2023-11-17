var { ...r } = {
  __proto__: { x: 123 },
  get y() {
    return 456;
  },
  z: 789,
};

console.log({ r });

console.log(
  Object.assign(
    { __proto__: Object.prototype },
    {
      get x() {
        return 123;
      },
    },
  ),
);
