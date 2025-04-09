import type {
  PrivateKeyName,
  PublicKeyName,
  PublicKeyValue,
} from "estree-sentry";
import type { Expression } from "./atom.d.ts";

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
      data: PublicKeyName | PublicKeyValue;
    };

export type PrivateKey = {
  computed: false;
  access: "private";
  converted: true;
  data: PrivateKeyName;
};

export type Key = PublicKey | PrivateKey;
