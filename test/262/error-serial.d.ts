export type ErrorSerial = {
  layer: "meta" | "base";
  name: string;
  message: string;
  stack: string | null;
};

export type StacklessErrorSerial = ErrorSerial & { stack: null };
