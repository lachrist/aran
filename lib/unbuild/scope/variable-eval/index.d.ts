import type { Cache } from "../../cache";

// It is tempting to add a static record here to improve performance.
// Unfortunately, variables defined in sloppy direct eval code can deleted.
// eval("delete x; var x = 123;") >> true

export type EvalFrame = {
  type: "eval";
  record: Cache;
};
