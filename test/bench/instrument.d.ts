export type Instrument = (file: {
  path: string;
  kind: "script" | "module";
  code: string;
}) => string;
