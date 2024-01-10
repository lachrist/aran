export type Config = {
  global: estree.Variable;
  intrinsic: estree.Variable | null;
  escape: estree.Variable;
};
