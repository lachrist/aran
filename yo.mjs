class C {
  [console.log("foo")] = 123;
  static ["prototype"] = 456;
  [console.log("bar")] = 789;
}

console.log("yo");
