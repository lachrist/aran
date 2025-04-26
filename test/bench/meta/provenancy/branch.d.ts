import { TestKind } from "aran";

export type Branch = {
  kind: TestKind;
  prov: number;
  hash: string;
};

export type Trace = Branch[];
