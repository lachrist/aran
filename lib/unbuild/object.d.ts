import { ChainPrelude } from "./prelude.js";
import { ExpressionSequence, Sequence } from "./sequence.js";

export type SuperObject = {
  type: "super";
};

export type RegularObject = {
  type: "regular";
  data: ExpressionSequence;
};

export type Object = SuperObject | RegularObject;
