
// type Lexic = Either (IsLast, Completion) IsFunction
// type IsLast = Boolean
// type Competion = Container
// type IsFunction = Boolean

/////////////
// Closure //
/////////////

exports._function = () => true;

exports._is_function = (lexic) => lexic === true;

exports._arrow = () => false;

exports._is_arrow = (lexic) => lexic === false;

/////////////
// Program //
/////////////

exports._program = (container) => ({
  is_last: true,
  completion: container
});

exports._is_program = (lexic) => lexic !== true && lexic !== false;

exports._get_program_completion = (lexic) => {
  if (typeof lexic === "boolean") {
    throw new global_Error("Closure lexic used as program lexic");
  }
  return lexic.completion;
};

exports._is_program_last = (lexic) => {
  if (typeof lexic === "boolean") {
    throw new global_Error("Closure lexic used as program lexic");
  }
  return lexic.is_last;
};

exports._set_is_program_last = (lexic, is_last) => {
  if (typeof lexic === "boolean") {
    throw new global_Error("Closure lexic used as program lexic");
  }
  return lexic.is_last === is_last ? lexic : {
    is_last: true,
    completion: lexic.container
  };
};

