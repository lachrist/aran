const proxy = new Proxy(
  {},
  {
    getPrototypeOf: () => {
      console.log("getPrototypeOf");
      return null;
    },
  },
);

console.log(proxy instanceof Object);
