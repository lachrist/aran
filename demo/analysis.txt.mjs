const { show, log, aran, astring, acorn, target } = context;

let depth = 0;

globalThis.ADVICE = {
  "apply@around": (_state, callee, this_, arguments_, _path) => {
    depth += 1;
    const indent = "..".repeat(depth);
    try {
      const args = arguments_.map(show).join(", ");
      log(`${indent} > ${show(callee)}[${show(this_)}](${args})\n`);
      const result = Reflect.apply(callee, this_, arguments_);
      log(`${indent} < ${show(result)}\n`);
      return result;
    } catch (error) {
      log(`${indent} ! ${show(error)}\n`);
    } finally {
      depth -= 1;
    }
  },
};

globalThis.eval(astring.generate(aran.generateSetup()));

globalThis.eval(
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
