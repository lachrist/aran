export type Ancestry = {
  program: "module" | "script";
  closure:
    | "none"
    | "function"
    | "method"
    | "constructor"
    | "derived-constructor";
};
