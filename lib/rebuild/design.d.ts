import { BinaryOperator, UnaryOperator } from "estree";
import { Atom } from "./atom";

export type MemberDesign = aran.Expression<Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.get";
  };
  this: aran.Expression<Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [aran.Expression<Atom>, aran.Expression<Atom>];
};

export type ArrayDesign = aran.Expression<Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: aran.Expression<Atom> & {
    type: "PrimitiveExpression";
  };
};

export type ListDesign<X> = aran.Expression<Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: aran.Expression<Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: X[];
};

export type PairDesign<X, Y> = aran.Expression<Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: aran.Expression<Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [X, Y];
};

export type ObjectDesign = aran.Expression<Atom> & {
  callee: aran.Expression<Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.createObject";
  };
  this: aran.Expression<Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [aran.Expression<Atom>, ...aran.Expression<Atom>[]];
};

export type UnaryDesign = aran.Expression<Atom> & {
  callee: aran.Expression<Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.unary";
  };
  this: aran.Expression<Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [
    aran.Expression<Atom> & {
      type: "PrimitiveExpression";
      primitive: UnaryOperator;
    },
    aran.Expression<Atom>,
  ];
};

export type BinaryDesign = aran.Expression<Atom> & {
  callee: aran.Expression<Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.unary";
  };
  this: aran.Expression<Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [
    aran.Expression<Atom> & {
      type: "PrimitiveExpression";
      primitive: BinaryOperator;
    },
    aran.Expression<Atom>,
    aran.Expression<Atom>,
  ];
};
