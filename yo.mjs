const callee = globalThis.eval;
const argument = "123;";

callee === intrinsic.eval ? eval(argument) : callee(argument);
