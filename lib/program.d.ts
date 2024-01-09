import { Context } from "./context";

export type Program<B> = {
  root: estree.Program;
  base: B;
};
