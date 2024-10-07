export type ArrayTree<X> = X | ArrayTree<X>[];

export type TreeType = "x" | "X" | "t" | "T";

export type TreeNode<X> = X | X[] | Tree<X> | Tree<X>[];

export type Tree<X> =
  // 0 //
  | [""]
  // 1 //
  | ["x", X]
  | ["X", X[]]
  | ["t", Tree<X>]
  | ["T", Tree<X>[]]
  // 2 //
  | ["XT", X[], Tree<X>[]]
  | ["Xt", X[], Tree<X>]
  | ["TT", Tree<X>[], Tree<X>[]]
  | ["Tt", Tree<X>[], Tree<X>]
  | ["tt", Tree<X>, Tree<X>]
  | ["tT", Tree<X>, Tree<X>[]]
  | ["xt", X, Tree<X>]
  // 3 //
  | ["ttt", Tree<X>, Tree<X>, Tree<X>]
  | ["tTT", Tree<X>, Tree<X>[], Tree<X>[]]
  | ["tTt", Tree<X>, Tree<X>[], Tree<X>]
  | ["Xtt", X[], Tree<X>, Tree<X>]
  // 4 //
  | ["tttt", Tree<X>, Tree<X>, Tree<X>, Tree<X>]
  // 6 //
  | ["XXXttt", X[], X[], X[], Tree<X>, Tree<X>, Tree<X>];
