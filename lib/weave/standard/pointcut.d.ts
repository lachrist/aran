import type { ArgAtom, Tag } from "../atom";
import type { AspectTyping, Kind, Pointcut } from "./aspect";

export type InternalPointcut = Pointcut<Tag>;

export type NormalInternalPointcut = {
  [key in Kind]: AspectTyping<never, ArgAtom, never>[key]["pointcut"];
};
