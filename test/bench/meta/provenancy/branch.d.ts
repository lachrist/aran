import type { TestKind } from "aran";
import type { Node } from "estree-sentry";

export type Branch = {
  type: Node<{}>["type"];
  prov: number;
  hash: number;
};

export type Trace = Branch[];
