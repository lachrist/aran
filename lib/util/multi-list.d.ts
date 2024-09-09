export type List<X> = null | {
  head: X;
  tail: List<X>;
};

export type MultiList<X> =
  | null
  | {
      type: "single";
      head: X;
      tail: MultiList<X>;
    }
  | {
      type: "multiple";
      head: X[];
      tail: MultiList<X>;
    };
