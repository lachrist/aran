
(function () {
  var x = 1;
  if(eval("x") !== 1)
    throw new Error("EvalCall1");
  let success = true;
  try {
    global.eval("x");
  } catch (error) {
    success = false;
  }
  if (success)
    throw new Error("EvalCall2");
} ());
