const { JSON, Array } = globalThis;

/**
 * @type {<X>(
 *   outcome: import("./parser.d.ts").Outcome<X>,
 * ) => outcome is import("./parser.d.ts").Failure}
 */
export const isFailure = (outcome) =>
  typeof outcome === "string" || Array.isArray(outcome);

/**
 * @type {<X>(
 *   outcome: import("./parser.d.ts").Outcome<X>,
 * ) => outcome is import("./parser.d.ts").Success<X>}
 */
export const isSuccess = (outcome) => !isFailure(outcome);

///////////////
// TypeClass //
///////////////

/**
 * @type {<X, Y>(
 *   parser: import("./parser.d.ts").Parser<X>,
 *   update: (result: X) => Y,
 * ) => import("./parser.d.ts").Parser<Y>}
 */
export const mapParser = (parser, update) => (source) => {
  const outcome = parser(source);
  if (isFailure(outcome)) {
    return outcome;
  } else {
    return {
      result: update(outcome.result),
      source: outcome.source,
    };
  }
};

/**
 * @type {<X>(
 *   result: X,
 * ) => import("./parser.d.ts").Parser<X>}
 */
export const zeroParser = (result) => (source) => ({
  result,
  source,
});

/**
 * @type {<X, Y>(
 *   parser: import("./parser.d.ts").Parser<X>,
 *   binder: (
 *     input: X,
 *   ) => import("./parser.d.ts").Parser<Y>,
 * ) => import("./parser.d.ts").Parser<Y>}
 */
export const bindParser = (parser, binder) => (source) => {
  const outcome = parser(source);
  if (isFailure(outcome)) {
    return outcome;
  } else {
    return binder(outcome.result)(outcome.source);
  }
};

/**
 * @type {<X, Y, Z>(
 *   parser1: import("./parser.d.ts").Parser<X>,
 *   parser2: import("./parser.d.ts").Parser<Y>,
 *   combine: (result1: X, result2: Y) => Z,
 * ) => import("./parser.d.ts").Parser<Z>}
 */
export const bindTwoParser = (parser1, parser2, combine) => (source) => {
  const outcome1 = parser1(source);
  if (isFailure(outcome1)) {
    return outcome1;
  }
  const outcome2 = parser2(outcome1.source);
  if (isFailure(outcome2)) {
    return outcome2;
  }
  return {
    result: combine(outcome1.result, outcome2.result),
    source: outcome2.source,
  };
};

/**
 * @type {<X, Y, Z, T>(
 *   parser1: import("./parser.d.ts").Parser<X>,
 *   parser2: import("./parser.d.ts").Parser<Y>,
 *   parser3: import("./parser.d.ts").Parser<Z>,
 *   combine: (result1: X, result2: Y, result3: Z) => T,
 * ) => import("./parser.d.ts").Parser<T>}
 */
export const bindThreeParser =
  (parser1, parser2, parser3, combine) => (source) => {
    const outcome1 = parser1(source);
    if (isFailure(outcome1)) {
      return outcome1;
    }
    const outcome2 = parser2(outcome1.source);
    if (isFailure(outcome2)) {
      return outcome2;
    }
    const outcome3 = parser3(outcome2.source);
    if (isFailure(outcome3)) {
      return outcome3;
    }
    return {
      result: combine(outcome1.result, outcome2.result, outcome3.result),
      source: outcome3.source,
    };
  };

/**
 * @type {<X>(
 *   parser1: import("./parser.d.ts").Parser<null>,
 *   parser2: import("./parser.d.ts").Parser<X>,
 * ) => import("./parser.d.ts").Parser<X>}
 */
export const thenParser = (parser1, parser2) => (source) => {
  const outcome = parser1(source);
  if (isFailure(outcome)) {
    return outcome;
  } else {
    return parser2(outcome.source);
  }
};

////////////
// Atomic //
////////////

/**
 * @type {<X>(
 *   result: X,
 * ) => import("./parser.d.ts").Parser<X>}
 */
export const parseSuccess = (result) => (_source) => ({
  result,
  source: "",
});

/**
 * @type {import("./parser.d.ts").Parser<null>}
 */
export const parseEnd = (source) => {
  if (source === "") {
    return { source: "", result: null };
  } else {
    return `Expected end of source but got ${JSON.stringify(source)}`;
  }
};

/**
 * @type {<X>(
 *   parser: import("./parser.d.ts").Parser<X>,
 * ) => import("./parser.d.ts").Parser<X | null>}
 */
export const parseTry = (parser) => (source) => {
  const outcome = parser(source);
  if (isFailure(outcome)) {
    return {
      result: null,
      source,
    };
  } else {
    return outcome;
  }
};

/**
 * @type {(exact: string) => import("./parser.d.ts").Parser<null>}
 */
export const parseExact = (string) => (source) => {
  if (source.startsWith(string)) {
    return {
      result: null,
      source: source.slice(string.length),
    };
  } else {
    return `Expected ${JSON.stringify(string)} but got ${JSON.stringify(
      source.slice(0, string.length),
    )}`;
  }
};

/**
 * @type {(regexp: RegExp) => import("./parser.d.ts").Parser<string>}
 */
export const parseRegexp = (regexp) => (source) => {
  const match = regexp.exec(source);
  if (match === null) {
    return `Expected ${regexp} but got ${JSON.stringify(source)}`;
  } else {
    return {
      result: match[0],
      source: source.slice(match[0].length),
    };
  }
};

////////////////
// Combinator //
////////////////

/**
 * @type {<X>(
 *   parser1: import("./parser.d.ts").Parser<X>,
 *   parser2: import("./parser.d.ts").Parser<X>,
 * ) => import("./parser.d.ts").Parser<X>}
 */
export const parseElse = (parser1, parser2) => (source) => {
  const outcome1 = parser1(source);
  if (!isFailure(outcome1)) {
    return outcome1;
  }
  const outcome2 = parser2(source);
  if (!isFailure(outcome2)) {
    return outcome2;
  }
  return [outcome1, outcome2];
};

/**
 * @type {<X>(
 *   parser: import("./parser.d.ts").Parser<X>[],
 * ) => import("./parser.d.ts").Parser<X>}
 */
export const parseChoice = (parsers) => (source) => {
  /** @type {import("./parser.d.ts").Failure} */
  const failure = [];
  for (const parser of parsers) {
    const outcome = parser(source);
    if (!isFailure(outcome)) {
      return outcome;
    }
    failure.push(outcome);
  }
  return failure;
};

/**
 * @type {<X>(
 *   parser: import("./parser.d.ts").Parser<X>,
 * ) => import("./parser.d.ts").Parser<X[]>}
 */
export const parseMany = (parser) => (source) => {
  const results = [];
  let remainder = source;
  while (true) {
    const outcome = parser(remainder);
    if (isFailure(outcome)) {
      return {
        result: results,
        source: remainder,
      };
    } else {
      results.push(outcome.result);
      remainder = outcome.source;
    }
  }
};

/**
 * @type {<X>(
 *   parser: import("./parser.d.ts").Parser<X>,
 * ) => import("./parser.d.ts").Parser<X[]>}
 */
export const parseSome = (parser) => (source) => {
  const outcome = parser(source);
  if (isFailure(outcome)) {
    return outcome;
  } else {
    const results = [outcome.result];
    let remainder = outcome.source;
    while (true) {
      const outcome = parser(remainder);
      if (isFailure(outcome)) {
        return {
          result: results,
          source: remainder,
        };
      } else {
        results.push(outcome.result);
        remainder = outcome.source;
      }
    }
  }
};

/**
 * @type {<X>(
 *   parser1: import("./parser.d.ts").Parser<null>,
 *   parser2: import("./parser.d.ts").Parser<X>,
 *   parser3: import("./parser.d.ts").Parser<null>,
 * ) => import("./parser.d.ts").Parser<X>}
 */
export const parseBetween = (parser1, parser2, parser3) => (source) => {
  const outcome1 = parser1(source);
  if (isFailure(outcome1)) {
    return outcome1;
  }
  const outcome2 = parser2(outcome1.source);
  if (isFailure(outcome2)) {
    return outcome2;
  }
  const outcome3 = parser3(outcome2.source);
  if (isFailure(outcome3)) {
    return outcome3;
  }
  return {
    result: outcome2.result,
    source: outcome3.source,
  };
};

/**
 * @type {<X>(
 *   parser1: import("./parser.d.ts").Parser<X>,
 *   parser2: import("./parser.d.ts").Parser<null>,
 * ) => import("./parser.d.ts").Parser<X[]>}
 */
export const parseSeparate = (parser1, parser2) => (source) => {
  const results = [];
  let remainder = source;
  while (true) {
    const outcome1 = parser1(remainder);
    if (isFailure(outcome1)) {
      return {
        result: results,
        source: remainder,
      };
    }
    remainder = outcome1.source;
    results.push(outcome1.result);
    const outcome2 = parser2(remainder);
    if (isFailure(outcome2)) {
      return {
        result: results,
        source: remainder,
      };
    }
    remainder = outcome2.source;
  }
};
