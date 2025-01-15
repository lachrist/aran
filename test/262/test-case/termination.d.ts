import { ErrorSerial } from "../util/error-serial";

export type Termination = {
  done: Promise<null | ErrorSerial>;
  print: (message: unknown) => void;
};
