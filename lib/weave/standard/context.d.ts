import type { RebootRecord } from "../../reboot";
import type { Depth } from "../depth";
import type { NormalPointcut } from "./aspect";

export type Context = {
  depth: Depth;
  reboot: RebootRecord;
  pointcut: NormalPointcut;
};
