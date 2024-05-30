import { Atom } from "./atom";

export type ArgumentList =
  | {
      type: "spread";
      values: aran.Expression<Atom>[];
    }
  | {
      type: "concat";
      value: aran.Expression<Atom>;
    };
