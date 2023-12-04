import {
  bindThreeParser,
  bindTwoParser,
  isFailure,
  mapParser,
  parseBetween,
  parseElse,
  parseExact,
  parseMany,
  parseRegexp,
  parseSeparate,
  parseSome,
  parseSuccess,
  parseTry,
  thenParser,
} from "./parser.mjs";

const {
  Math,
  JSON,
  TypeError,
  Reflect: { ownKeys: listKey },
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @type {import("./parser.d.ts").Parser<null>}
 */
const parseSpace = mapParser(parseRegexp(/ *(\n *\* *)*/u), () => null);

/**
 * @type {Record<import("./jsdoc-comment.d.ts").Keyword, null>}
 */
const keywords = {
  ".": null,
  ",": null,
  "(": null,
  ")": null,
  "{": null,
  "}": null,
  "[": null,
  "]": null,
  "<": null,
  ">": null,
  "@template": null,
  "@typedef": null,
  "@type": null,
  "import": null,
};

const parseKeyword = /**
 * @type {Record<
 *   import("./jsdoc-comment.d.ts").Keyword,
 *   import("./parser.js").Parser<null>
 * >}
 */ (
  reduceEntry(
    /** @type {import("./jsdoc-comment.d.ts").Keyword[]} */ (
      listKey(keywords)
    ).map((keyword) => [keyword, thenParser(parseSpace, parseExact(keyword))]),
  )
);

/**
 * @type {import("./parser.d.ts").Parser<string>}
 */
const parseStringLiteral = mapParser(parseRegexp(/^"[^"]*"/u), (literal) =>
  literal.slice(1, -1),
);

/** @type {import("./parser.d.ts").Parser<string>} */
const parseIdentifier = thenParser(parseSpace, parseRegexp(/^[a-zA-Z]+/u));

/**
 * @type {import("./parser.d.ts").Parser<string>}
 */
const parseType = parseBetween(
  parseKeyword["{"],
  bindTwoParser(
    parseRegexp(/[^{}]*/u),
    parseTry((source) => parseType(source)),
    (prefix, suffix) => `{ ${prefix}${suffix ?? ""} }`,
  ),
  parseKeyword["}"],
);

/**
 * @type {import("./parser.d.ts").Parser<
 *   import("./jsdoc-comment.d.ts").Template
 * >}
 */
const parseTemplate = thenParser(
  parseKeyword["@template"],
  bindTwoParser(parseTry(parseType), parseIdentifier, (type, identifier) => ({
    identifier,
    type,
  })),
);

/**
 * @type {import("./parser.d.ts").Parser<
 *   import("./jsdoc-comment.d.ts").Import
 * >}
 */
const parseImport = parseElse(
  parseBetween(
    parseKeyword["("],
    (source) => parseImport(source),
    parseKeyword[")"],
  ),
  thenParser(
    parseKeyword.import,
    bindThreeParser(
      parseBetween(parseKeyword["("], parseStringLiteral, parseKeyword[")"]),
      parseMany(thenParser(parseKeyword["."], parseIdentifier)),
      parseTry(
        parseBetween(
          parseKeyword["<"],
          parseSeparate(parseIdentifier, parseKeyword[","]),
          parseKeyword[">"],
        ),
      ),
      (source, specifier, parameters) => ({
        source,
        specifier,
        parameters: parameters ?? [],
      }),
    ),
  ),
);

/**
 * @type {import("./parser.d.ts").Parser<
 *   import("./jsdoc-comment.d.ts").Definition
 * >}
 */
const parseDefinition = thenParser(
  parseKeyword["@typedef"],
  bindTwoParser(
    parseBetween(parseKeyword["{"], parseImport, parseKeyword["}"]),
    parseIdentifier,
    ({ source, specifier, parameters }, identifier) => ({
      identifier,
      source,
      specifier,
      parameters,
    }),
  ),
);

/**
 * @type {import("./parser.d.ts").Parser<
 *   import("./jsdoc-comment.d.ts").Declaration[]
 * >}
 */
const parseDeclaration = parseElse(
  bindTwoParser(
    parseSome(parseTemplate),
    parseDefinition,
    (templates, definition) => [{ templates, definition }],
  ),
  mapParser(parseSome(parseDefinition), (definitions) =>
    definitions.map((definition) => ({
      templates: [],
      definition,
    })),
  ),
);

/**
 * @type {import("./parser.d.ts").Parser<
 *   import("./jsdoc-comment.d.ts").Comment
 * >}
 */
const parseDeclarationComment = mapParser(parseDeclaration, (declarations) => ({
  type: "declaration",
  declarations,
}));

/**
 * @type {import("./parser.d.ts").Parser<
 *   import("./jsdoc-comment.d.ts").Comment
 * >}
 */
const parseAnnotationComment = thenParser(
  parseKeyword["@type"],
  mapParser(parseType, (annotation) => ({
    type: "annotation",
    annotation,
  })),
);

/**
 * @type {import("./parser.d.ts").Parser<
 *   import("./jsdoc-comment.d.ts").Comment
 * >}
 */
const parseComment = parseElse(
  thenParser(
    mapParser(parseRegexp(/^[^*]/u), (_match) => null),
    parseSuccess({ type: "other" }),
  ),
  parseBetween(
    parseExact("*"),
    parseElse(parseAnnotationComment, parseDeclarationComment),
    mapParser(parseRegexp(/^\s*$/), (_match) => null),
  ),
);

/**
 * @type {<X, Y>(xs: X[], ys: Y[]) => [X, Y][]}
 */
const zip = (xs, ys) => {
  const result = [];
  const length = Math.min(xs.length, ys.length);
  for (let index = 0; index < length; index += 1) {
    result.push([xs[index], ys[index]]);
  }
  return /** @type {any} */ (result);
};

/**
 * @type {(
 *   annation: string,
 * ) => string[]}
 */
const checkAnnotation = (annotation) =>
  annotation.includes("import(")
    ? [`Type comment should not contain import`]
    : [];

/**
 * @type {(
 *   declaration: import("./jsdoc-comment.d.ts").Declaration,
 * ) => string[]}
 */
const checkDeclaration = (declaration) => [
  ...(declaration.templates.length !== declaration.definition.parameters.length
    ? [
        `Template count ${declaration.templates.length} does not match parameter count ${declaration.definition.parameters.length}`,
      ]
    : []),
  ...zip(declaration.templates, declaration.definition.parameters)
    .filter(([template, parameter]) => template.identifier !== parameter)
    .map(
      ([template, parameter]) =>
        `Template type ${JSON.stringify(
          template.type,
        )} does not match parameter type ${JSON.stringify(parameter)}`,
    ),
  ...((declaration.definition.source.startsWith("./") ||
    declaration.definition.source.startsWith("../")) &&
  !declaration.definition.source.endsWith(".d.ts")
    ? [
        `Internal import ${JSON.stringify(
          declaration.definition.source,
        )} should end with .d.ts`,
      ]
    : []),
];

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce project-specific JsDoc style",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => {
    for (const node of context.sourceCode.getAllComments()) {
      /** @type {(message: string) => void} */
      const report = (message) => {
        context.report({
          loc: node.loc ?? { line: 0, column: 0 },
          message,
        });
      };
      if (node.type === "Block") {
        const outcome = parseComment(node.value);
        if (isFailure(outcome)) {
          report(
            `Could not parse comment ${JSON.stringify(
              node.value,
            )} >> ${JSON.stringify(outcome, null, 2)}`,
          );
        } else {
          const { result: comment } = outcome;
          if (comment.type === "declaration") {
            comment.declarations.flatMap(checkDeclaration).forEach(report);
          } else if (comment.type === "annotation") {
            checkAnnotation(comment.annotation).forEach(report);
          } else if (comment.type === "other") {
            // noop;
          } else {
            throw new TypeError("Invalid comment");
          }
        }
      }
    }
    return {};
  },
};
