export type Tree<X> =
  | { type: "void" }
  | {
      type: "binary-node";
      branch1: Tree<X>;
      branch2: Tree<X>;
    }
  | {
      type: "ternary-node";
      branch1: Tree<X>;
      branch2: Tree<X>;
      branch3: Tree<X>;
    }
  | {
      type: "quaternary-node";
      branch1: Tree<X>;
      branch2: Tree<X>;
      branch3: Tree<X>;
      branch4: Tree<X>;
    }
  | {
      type: "multi-node";
      branches: Tree<X>[];
    }
  | {
      type: "unary-leaf";
      leaf: X;
    }
  | {
      type: "binary-leaf";
      leaf1: X;
      leaf2: X;
    }
  | {
      type: "ternary-leaf";
      leaf1: X;
      leaf2: X;
      leaf3: X;
    }
  | {
      type: "multi-leaf";
      leafs: X[];
    };
