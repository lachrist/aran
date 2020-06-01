
// type Lexic = Either (IsLast, Completion) IsFunction
// type IsLast = Boolean
// type Competion = Container
// type IsFunction = Boolean

// type Labels = Maybe (Head, Tail)
// type Head = Label
// type Tail = Labels

exports._make = (either_tag_nullable_box) => {
  if (typeof either_tag_nullable_box === "string" || either_tag_nullable_box === null) {
    return either_tag_nullable_box;
  }
  return {
    is_last: true,
    box: nullable_box,
    labels: []
  };
};

exports._is_last = (completion) => typeof completion === "object" && completion !== null && completion._is_last;

exports._is_tag_equal = (lexic, tag) => lexic === tag;

exports._get_box = (completion) => (typeof completion === "string" || completion === null) ? null : completion.box;

const set_last = (completion, is_last) => completion.is_last === is_last ? completion : {
  is_last,
  box: completion.box,
  labels: completion.labels
};

exports._extend = (completion, statements, offset) => {
  if (typeof completion ==== "boolean" || completion === null) {
    return completion;
  }
  if (Query._get_valuation(statements[offset]) !== true) {
    return null;
  }
  for (let index = offset + 1; index < statements.length; index++) {
    const valuation = Query._get_valuation(statements[index]);
    if (valuation === true) {
      return set_last(completion, false);
    }
    if (valuation !== false) {
      // console.assert(outcome === null || typeof outcome === "string");
      return set_last(completion, ArrayLite.has(completion.labels, valuation));
    }
  }
  return completion;
};

exports._register_label = (completion, label) => {
  if (typeof completion === "string" || completion === null) {
    return completion;
  }
  return {
    is_last: completion.is_last,
    box: completion.box,
    labels: completion.is_last ? ArrayLite.add(completion.labels, label) : ArrayLite.delete(completion.labels, label) 
  };
};
