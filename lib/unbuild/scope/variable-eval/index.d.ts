import { Cache } from "../../cache";

// It would be tempting to add a static record here to improve performance.
// The problem is that variables defined in sloppy direct eval code can deleted.
// eval("delete x; var x = 123;") >> true

export type EvalFrame = {
  type: "eval";
  record: Cache;
};
