export type Pointcut =
  | "primitive@after"
  | "intrinsic@after"
  | "yield@after"
  | "import@after"
  | "await@after"
  | "closure@after"
  | "block@declaration"
  | "apply@around"
  | "construct@around"
  | "program-block@after";
