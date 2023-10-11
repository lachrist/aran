const { eval: evalGlobal } = globalThis;

const { default: instrument } = await import("./advices/empty.mjs");

console.log(instrument("`foo${123}bar`;", "script"));

// console.log(evalGlobal(instrument("123;", "script")));
