export type Config = {
  mode: "normal" | "standalone";
  global_variable: estree.Variable;
  intrinsic_variable: estree.Variable;
  escape_prefix: estree.Variable;
};
