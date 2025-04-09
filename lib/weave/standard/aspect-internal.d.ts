import type { ArgAtom } from "../atom.d.ts";
import type { AspectTyping, AspectKind, Pointcut } from "./aspect.d.ts";

export type InternalPointcut = Pointcut<ArgAtom>;

export type NormalInternalPointcut = {
  [key in AspectKind]: AspectTyping<ArgAtom, never>[key]["pointcut"];
};
