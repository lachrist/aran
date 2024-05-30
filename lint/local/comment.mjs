/**
 * @type {(
 *   node: import("eslint").Rule.Node,
 *   source: import("eslint").SourceCode,
 * ) => import("estree").Comment[]}
 */
export const listCommentBefore = (node, source) => {
  const token = source.getTokenBefore(node);
  return source.getCommentsBefore(
    token && token.type === "Punctuator" && token.value === "(" ? token : node,
  );
};

const regexp = /^\*\s*@type\s*\{\s*([^}]*)\s*\}\s*$/u;

/**
 * @type {(comment: string) => string | null}
 */
export const parseSimpleTypeAnnotation = (comment) => {
  const parts = regexp.exec(comment);
  return parts === null ? null : parts[1];
};
