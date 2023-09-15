declare namespace weave {
  type Variable = Brand<string, "weave.Variable">;
  type Node = aran.Node<Variable, Variable[]>;
  type Program = aran.Program<Variable, Variable[]>;
  type Link = aran.Link<Variable[]>;
  type ClosureBlock = aran.ClosureBlock<Variable, Variable[]>;
  type ControlBlock = aran.ControlBlock<Variable, Variable[]>;
  type PseudoBlock = aran.PseudoBlock<Variable, Variable[]>;
  type Statement = aran.Statement<Variable, Variable[]>;
  type Effect = aran.Effect<Variable, Variable[]>;
  type Expression = aran.Expression<Variable, Variable[]>;
}
