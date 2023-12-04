export type Context = {
  base: import("../../type/options.d.ts").Base;
  escape: estree.Variable;
  intrinsic: estree.Variable;
  advice: estree.Variable;
  hidden: aran.Parameter[];
};
