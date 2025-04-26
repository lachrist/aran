export type Pointcut =
  | "primitive@after"
  | "intrinsic@after"
  | "yield@after"
  | "import@after"
  | "eval@before"
  | "await@after"
  | "closure@after"
  | "block@declaration"
  | "apply@around"
  | "construct@around";
