export type Config = {
  mode: "default" | "standalone";
  global_variable: estree.Variable;
  intrinsic_variable: estree.Variable;
  escape_prefix: estree.Variable;
};
