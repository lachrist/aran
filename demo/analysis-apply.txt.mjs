const { show, log, aran, astring, acorn, target } = context;

let depth = 0;

globalThis.ADVICE = {
  "apply@around": (_state, callee, this_, arguments_, _path) => {
    depth += 1;
    const indent = "..".repeat(depth);
    try {
      const args = arguments_.map(show).join(", ");
      log(`${indent} > ${show(callee)}[${show(this_)}](${args})`);
      const result = Reflect.apply(callee, this_, arguments_);
      log(`${indent} < ${show(result)}`);
      return result;
    } catch (error) {
      log(`${indent} ! ${show(error)}`);
    } finally {
      depth -= 1;
    }
  },
};

globalThis.eval(
  astring.generate(
    aran.instrument(
      {
        kind: "eval",
        situ: { type: "global" },
        path: "main",
        root: acorn.parse(target, { ecmaVersion: 2024, sourceType: "script" }),
      },
      {
        mode: "standalone",
        advice_global_variable: "ADVICE",
        pointcut: ["apply@around"],
      },
    ),
  ),
);
