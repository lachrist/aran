import { UnknownFlexibleAspect, UnknownStandardAspect } from "../../../../lib";

export type Aspect =
  | {
      type: "standard";
      data: UnknownStandardAspect;
    }
  | {
      type: "flexible";
      data: UnknownFlexibleAspect;
    };
