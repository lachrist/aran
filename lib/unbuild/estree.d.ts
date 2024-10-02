import type { ObjectProperty } from "estree-sentry";

export type ProtoObjectProperty<X> = ObjectProperty<X> & {
  computed: false;
  key:
    | {
        type: "Identifier";
        name: "__proto__";
      }
    | {
        type: "Literal";
        value: "__proto__";
      };
};
