export type TransformMeta = (file: {
  path: string;
  kind: "module";
  code: string;
}) => string;

export type TransformBase = (file: {
  path: string;
  kind: "script" | "module";
  code: string;
}) => string;

export type Transform = {
  transformBase: TransformBase;
  transformMeta: TransformMeta;
};
