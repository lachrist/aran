import type { RebootRecord } from "../../reboot.js";
import type { ArgProgram } from "../atom";
import type { Depth } from "../depth.js";
import type { OptimalPointcut } from "./aspect.js";

export type Context = {
  depth: Depth;
  reboot: RebootRecord;
  pointcut: OptimalPointcut;
  root: ArgProgram;
};
