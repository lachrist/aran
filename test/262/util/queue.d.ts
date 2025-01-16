export type Item<X> =
  | {
      done: false;
      value: X;
    }
  | {
      done: true;
      value: undefined;
    };

export type Queue<X> = {
  done: boolean;
  buffer: X[];
  pendings: {
    resolve: (item: Item<X>) => void;
    reject: (error: Error) => void;
  }[];
};
