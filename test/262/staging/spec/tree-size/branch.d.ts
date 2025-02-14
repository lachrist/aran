import { EstreeNode } from "../../../../../lib";
import { Size } from "./size";

export type Branch = {
  path: string | number;
  type: EstreeNode<{}>["type"];
  size: Size;
};
