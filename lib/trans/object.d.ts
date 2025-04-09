import type { Expression } from "./atom.d.ts";

export type SuperObject = {
  type: "super";
};

export type RegularObject = {
  type: "regular";
  data: Expression;
};

export type Object = SuperObject | RegularObject;
