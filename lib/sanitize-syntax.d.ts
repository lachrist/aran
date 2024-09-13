export type CheckoutError = {
  context: "program" | "pattern" | "expression" | "statement";
  node: unknown;
  path: string;
};
