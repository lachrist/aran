const {
  log,
  target,
  aran: { instrument },
  astring: { generate },
  acorn: { parse },
} = /** @type {import("../context").Context} */ (
  // @ts-ignore
  context
);

/** @type {(value: unknown) => string} */
const show = (value) => {
  if (typeof value === "function") {
    return String(value.name ?? "anonynmous");
  } else if (typeof value === "object" && value !== null) {
    return "#" + Object.prototype.toString.call(value).slice(8, -1);
  } else if (typeof value === "symbol") {
    return "@" + String(value.description ?? "unknown");
  } else if (typeof value === "string") {
    return JSON.stringify(value);
  } else {
    return String(value);
  }
};

let depth = 0;

/** @type {import("aran").StandardAdvice} */
globalThis._ARAN_ADVICE_ = {
  "apply@around": (_state, callee, that, input, _location) => {
    depth += 1;
    const indent = "..".repeat(depth);
    try {
      const args = [
        ...(that === undefined ? [] : [`this=${show(that)}`]),
        ...input.map(show),
      ];
      log(indent + " >> " + show(callee) + "(" + args.join(", ") + ")");
      const result = Reflect.apply(/** @type {any} */ (callee), that, input);
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
        root: parse(target, { sourceType: "script", ecmaVersion: 2024 }),
      },
      {
        mode: "standalone",
        advice_global_variable: "_ARAN_ADVICE_",
        pointcut: ["apply@around"],
      },
    ),
  ),
);
