import type { Warning as UnbuildWarning } from "./unbuild/prelude/warning";
import type { Warning as WeaveWarning } from "./weave/warning";

export type Warning = UnbuildWarning | WeaveWarning;
