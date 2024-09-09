export type List<X> = null | {
  head: X;
  tail: List<X>;
};
