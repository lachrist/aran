const g = async function* () {
  yield 123;
  yield 456;
  throw "BOUM";
  yield 789;
};

try {
  for await (const value of g()) {
    console.log(value);
  }
} catch (error) {
  console.dir({ error });
}
