global.eval(`
  function f() {
    console.log({
      arguments: f.arguments,
      caller: f.caller,
    });
  }
  console.log({
    arguments: f.arguments,
    caller: f.caller,
  });
  f();
  console.log({
    arguments: f.arguments,
    caller: f.caller,
  });
`);
