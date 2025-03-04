const {
  log,
  target,
  acorn: { parse },
  astring: { generate },
  aran: { setupile, transpile, retropile },
  linvail: { weave, createRuntime },
} = /** @type {import("../context").Context} */ (
  // @ts-ignore
  context
);

const {
  eval: evalGlobal,
  JSON: { stringify },
  Reflect: { defineProperty },
} = globalThis;

const intrinsics = evalGlobal(generate(setupile()));

const { advice, library } = createRuntime(intrinsics, {
  dir: (value) => {
    log(stringify(value));
  },
  count: true,
});

const advice_global_variable = "__LINVAIL_ADVICE__";

defineProperty(globalThis, advice_global_variable, { value: advice });
defineProperty(globalThis, "Linvail", { value: library });
defineProperty(globalThis, "log", { value: log });

evalGlobal(
  generate(
    retropile(
      weave(
        transpile({
          path: "main",
          kind: "eval",
          situ: { type: "global" },
          root: parse(target, { sourceType: "script", ecmaVersion: 2024 }),
        }),
        { advice_global_variable },
      ),
    ),
  ),
);
