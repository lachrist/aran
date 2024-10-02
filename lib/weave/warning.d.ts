import type { Hash } from "../hash";

export type Warning = {
  name: "MissingEvalAdvice";
  hash: Hash;
};
