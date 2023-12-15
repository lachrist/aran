import type { Cache } from "../cache.d.ts";
import type { Arrow } from "./closure/arrow.d.ts";
import type { Closure } from "./closure/closure.d.ts";
import type { Private } from "./private/index.d.ts";

export type Param = {
  private: Private;
  closure: Closure;
  arrow: Arrow;
  catch: boolean;
};
