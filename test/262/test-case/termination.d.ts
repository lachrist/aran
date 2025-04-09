import type { ErrorSerial } from "../util/error-serial.d.ts";

export type Termination = {
  done: Promise<null | ErrorSerial>;
  print: (message: unknown) => void;
};
