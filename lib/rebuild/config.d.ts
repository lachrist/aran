export type Config = {
  global_variable: estree.Variable;
  intrinsic_variable: estree.Variable | null;
  escape_prefix: estree.Variable;
};
