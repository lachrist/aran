import type { UnknownAspect as UnknownStandardAspect } from "./standard/aspect.d.ts";
import type { UnknownAspect as UnknownFlexibleAspect } from "./flexible/aspect";

export type Aspect =
  | ({
      type: "standard";
    } & UnknownStandardAspect)
  | ({ type: "flexible" } & UnknownFlexibleAspect);
