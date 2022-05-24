export const dispatch0 = (clauses, discriminant) => {
  const clause = clauses[discriminant.type];
  return clause(discriminant);
};

export const dispatch1 = (clauses, discriminant, argument1) => {
  const clause = clauses[discriminant.type];
  return clause(discriminant, argument1);
};

export const dispatch2 = (clauses, discriminant, argument1, argument2) => {
  const clause = clauses[discriminant.type];
  return clause(discriminant, argument1, argument2);
};
