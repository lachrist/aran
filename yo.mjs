for (let { [console.log("foo")]: x } = (console.log("bar")) in []) {
  console.log("qux");
}
