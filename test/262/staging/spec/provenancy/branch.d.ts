import type { EstreeNode } from "aran";

export type Branch = {
  path: string | number;
  type: EstreeNode<{}>["type"];
  prov: number;
};
