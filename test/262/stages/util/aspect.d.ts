import {
  HomogeneousAspectFlexibleAspect,
  Json,
  StandardAspect,
} from "../../../../lib";

export type Aspect =
  | {
      type: "standard";
      data: StandardAspect<
        unknown,
        {
          Stack: unknown;
          Scope: unknown;
          Other: unknown;
        }
      >;
    }
  | {
      type: "flexible";
      data: HomogeneousAspectFlexibleAspect<unknown, unknown, Json[]>;
    };
