let x = 1;
if (eval("x") !== 1)
  throw new Error("EvalCall");