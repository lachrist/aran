import { BinaryOperator, UnaryOperator } from "estree";

export type MemberDesign = aran.Expression<rebuild.Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<rebuild.Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.get";
  };
  this: aran.Expression<rebuild.Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [aran.Expression<rebuild.Atom>, aran.Expression<rebuild.Atom>];
};

export type ArrayDesign = aran.Expression<rebuild.Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<rebuild.Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: aran.Expression<rebuild.Atom> & {
    type: "PrimitiveExpression";
  };
};

export type ListDesign<X> = aran.Expression<rebuild.Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<rebuild.Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: aran.Expression<rebuild.Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: X[];
};

export type PairDesign<X, Y> = aran.Expression<rebuild.Atom> & {
  type: "ApplyExpression";
  callee: aran.Expression<rebuild.Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "Array.of";
  };
  this: aran.Expression<rebuild.Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [X, Y];
};

export type ObjectDesign = aran.Expression<rebuild.Atom> & {
  callee: aran.Expression<rebuild.Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.createObject";
  };
  this: aran.Expression<rebuild.Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [
    aran.Expression<rebuild.Atom>,
    ...aran.Expression<rebuild.Atom>[],
  ];
};

export type UnaryDesign = aran.Expression<rebuild.Atom> & {
  callee: aran.Expression<rebuild.Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.unary";
  };
  this: aran.Expression<rebuild.Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [
    aran.Expression<rebuild.Atom> & {
      type: "PrimitiveExpression";
      primitive: UnaryOperator;
    },
    aran.Expression<rebuild.Atom>,
  ];
};

export type BinaryDesign = aran.Expression<rebuild.Atom> & {
  callee: aran.Expression<rebuild.Atom> & {
    type: "IntrinsicExpression";
    intrinsic: "aran.unary";
  };
  this: aran.Expression<rebuild.Atom> & {
    type: "PrimitiveExpression";
  };
  arguments: [
    aran.Expression<rebuild.Atom> & {
      type: "PrimitiveExpression";
      primitive: BinaryOperator;
    },
    aran.Expression<rebuild.Atom>,
    aran.Expression<rebuild.Atom>,
  ];
};
