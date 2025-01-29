// @ts-nocheck

const {
  log,
  target,
  aran: { instrument },
  astring: { generate },
  acorn: { parse },
} = context;

const show = (value) => {
  if (typeof value === "function") {
    const name = Object.hasOwn(value, "name") ? value.name : null;
    return typeof name === "string" ? `[function ${value.name}]` : `[function]`;
  } else if (typeof value === "object") {
    return Object.prototype.toString.call(value);
  } else if (typeof value === "string") {
    return JSON.stringify(value);
  } else if (typeof value === "symbol") {
    const name = value.description;
    return typeof name === "string" ? `[symbol ${name}]` : "[symbol]";
  } else {
    return String(value);
  }
};

let depth = 0;

globalThis._ARAN_ADVICE_ = {
  "apply@around": (_state, callee, that, args, _location) => {
    depth += 1;
    const indent = "..".repeat(depth);
    try {
      log(
        indent +
          " >> " +
          show(callee) +
          (that === undefined ? "" : `<this=${show(that)}>`) +
          "(" +
          args.map(show).join(", ") +
          ")",
      );
      const result = Reflect.apply(callee, that, args);
      log(`${indent} << ${show(result)}`);
      return result;
    } catch (error) {
      log(`${indent} !! ${show(error)}`);
      throw error;
    } finally {
      depth -= 1;
    }
  },
};

globalThis.eval(
  generate(
    instrument(
      {
        kind: "eval",
        path: "main",
        root: parse(target, { ecmaVersion: 2024 }),
      },
      {
        mode: "standalone",
        advice_global_variable: "_ARAN_ADVICE_",
        pointcut: ["apply@around"],
      },
    ),
  ),
);
