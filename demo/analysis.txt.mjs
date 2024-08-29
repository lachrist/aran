const { eval: evalGlobal, JSON } = globalThis;
const { log, aran, astring, acorn, target } = context;
let depth = 0;
const show = (value) => {
  if (typeof value === "function") {
    return value.name ?? "<anonymous>";
  }
  if (typeof value === "object") {
    return value === null ? "null" : "<object>";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return String(value);
};
globalThis.ADVICE = {
  "apply@around": (_state, callee, this_, arguments_) => {
    depth += 1;
    log(
      `${"..".repeat(depth)} > ${show(callee)}(${arguments_
        .map(show)
        .join(", ")})\n`,
    );
    const result = Reflect.apply(callee, this_, arguments_);
    log(`${"..".repeat(depth)} < ${show(result)}\n`);
    depth -= 1;
    return result;
  },
};
evalGlobal(astring.generate(aran.generateSetup()));
evalGlobal(
  astring.generate(
    aran.instrument(
      {
        kind: "script",
        situ: { type: "global" },
        path: "$",
        root: acorn.parse(target, { ecmaVersion: 2024, sourceType: "script" }),
      },
      {
        advice_variable: "ADVICE",
        standard_pointcut: ["apply@around"],
      },
    ),
  ),
);
