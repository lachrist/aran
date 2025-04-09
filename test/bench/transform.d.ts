export type Transform = {
  transformBase: (code: string) => string;
  transformMeta: (code: string) => string;
};
