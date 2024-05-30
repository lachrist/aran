import type { Key as EstreeKey, PrivateKey as EstreePrivateKey } from "../estree";
import type { Expression } from "./atom";

export type PublicKey =
  | {
      computed: true;
      access: "public";
      converted: boolean;
      data: Expression;
    }
  | {
      computed: false;
      access: "public";
      converted: true;
      data: EstreeKey;
    };

export type PrivateKey = {
  computed: false;
  access: "private";
  converted: true;
  data: EstreePrivateKey;
};

export type Key = PublicKey | PrivateKey;
