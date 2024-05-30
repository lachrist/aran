import { Atom } from "./atom";

export type SuperObject = {
  type: "super";
};

export type RegularObject = {
  type: "regular";
  data: aran.Expression<Atom>;
};

export type Object = SuperObject | RegularObject;
