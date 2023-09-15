declare namespace unbuild {
  type Variable = Brand<string, "unbuild.Variable">;
  type Node<S> = aran.Node<Variable, S>;
  type Program<S> = aran.Program<Variable, S>;
  type Link<S> = aran.Link<S>;
  type ClosureBlock<S> = aran.ClosureBlock<Variable, S>;
  type ControlBlock<S> = aran.ControlBlock<Variable, S>;
  type PseudoBlock<S> = aran.PseudoBlock<Variable, S>;
  type Statement<S> = aran.Statement<Variable, S>;
  type Effect<S> = aran.Effect<Variable, S>;
  type Expression<S> = aran.Expression<Variable, S>;
}
