import type { BinaryOperator, UnaryOperator } from "estree";
import type { Expression } from "./atom.d.ts";

export type MemberDesign = Expression & {
  type: "ApplyExpression";
  callee: Expression & {
    type: "IntrinsicExpression";
    intrinsic: "aran.getValueProperty";
  };
  this: Expression & {
    type: "PrimitiveExpression";
  };
  arguments: [Expression, Expression];
};

export type ArrayDesign = Expression & {
  type: "ApplyExpression";
  callee: Expression & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: Expression & {
    type: "PrimitiveExpression";
  };
};

export type ListDesign<X> = Expression & {
  type: "ApplyExpression";
  callee: Expression & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: Expression & {
    type: "PrimitiveExpression";
  };
  arguments: X[];
};

export type PairDesign<X, Y> = Expression & {
  type: "ApplyExpression";
  callee: Expression & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: Expression & {
    type: "PrimitiveExpression";
  };
  arguments: [X, Y];
};

export type ObjectDesign = Expression & {
  callee: Expression & {
    type: "IntrinsicExpression";
    intrinsic: "aran.createObject";
  };
  this: Expression & {
    type: "PrimitiveExpression";
  };
  arguments: [Expression, ...Expression[]];
};

export type UnaryDesign = Expression & {
  callee: Expression & {
    type: "IntrinsicExpression";
    intrinsic: "aran.performUnaryOperation";
  };
  this: Expression & {
    type: "PrimitiveExpression";
  };
  arguments: [
    Expression & {
      type: "PrimitiveExpression";
      primitive: UnaryOperator;
    },
    Expression,
  ];
};

export type BinaryDesign = Expression & {
  callee: Expression & {
    type: "IntrinsicExpression";
    intrinsic: "aran.performUnaryOperation";
  };
  this: Expression & {
    type: "PrimitiveExpression";
  };
  arguments: [
    Expression & {
      type: "PrimitiveExpression";
      primitive: BinaryOperator;
    },
    Expression,
    Expression,
  ];
};
