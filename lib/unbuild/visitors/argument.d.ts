export type ArgumentList =
  | {
      type: "spread";
      values: aran.Expression<unbuild.Atom>[];
    }
  | {
      type: "concat";
      value: aran.Expression<unbuild.Atom>;
    };
