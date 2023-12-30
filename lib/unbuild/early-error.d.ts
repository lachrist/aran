export type EarlyError = {
  // this expression should be scope-independent;
  guard: aran.Expression<unbuild.Atom> | null;
  message: string;
  path: unbuild.Path;
};
