import type { ForStatement, VariableDeclaration } from "estree-sentry";
import type {
  ObjectProperty,
  PropertyDefinition,
  StaticBlock,
} from "estree-sentry";

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

export type ClassPropertyDefinition<X> = PropertyDefinition<X> & {
  static: true;
};

export type StaticPrelude<X> = StaticBlock<X> | ClassPropertyDefinition<X>;

export type InstancePropertyDefinition<X> = PropertyDefinition<X> & {
  static: false;
};

export type LexicalForStatement<X> = ForStatement<X> & {
  init: VariableDeclaration<X> & {
    kind: "let" | "const";
  };
};
