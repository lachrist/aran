export type IllegalFrame = {
  type: "illegal";
  record: { [k in estree.Variable]?: string };
};
