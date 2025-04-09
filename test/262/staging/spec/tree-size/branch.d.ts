import type { EstreeNode } from "aran";
import type { Size } from "./size.d.ts";

export type Branch = {
  path: string | number;
  type: EstreeNode<{}>["type"];
  size: Size;
};
