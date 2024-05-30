import type { Expression } from "./atom";

export type SuperObject = {
  type: "super";
};

export type RegularObject = {
  type: "regular";
  data: Expression;
};

export type Object = SuperObject | RegularObject;
