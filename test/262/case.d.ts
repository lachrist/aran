export type Termination = {
  done: Promise<null | string>;
  print: (message: unknown) => void;
};
