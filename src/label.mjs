const {
  Reflect: {apply},
  String: {
    prototype: {substring},
  },
} = globalThis;

const FULL_BREAK_HEAD = "B";
const FULL_CONTINUE_HEAD = "C";
const EMPTY_BREAK_HEAD = "b";
const EMPTY_CONTINUE_HEAD = "c";

const ONE = [1];
export const getLabelBody = (label) => apply(substring, label, ONE);

const generatePrepend = (head) => (body) => `${head}${body}`;
export const makeFullBreakLabel = generatePrepend(FULL_BREAK_HEAD);
export const makeFullContinueLabel = generatePrepend(FULL_CONTINUE_HEAD);
export const makeEmptyBreakLabel = generatePrepend(EMPTY_BREAK_HEAD);
export const makeEmptyContinueLabel = generatePrepend(EMPTY_CONTINUE_HEAD);

const generateTestHead = (head1, head2) => (label) =>
  label[0] === head1 || label[1] === head2;
export const isBreakLabel = generateTestHead(FULL_BREAK_HEAD, EMPTY_BREAK_HEAD);
export const isContinueLabel = generateTestHead(
  FULL_CONTINUE_HEAD,
  EMPTY_CONTINUE_HEAD,
);
export const isEmptyLabel = generateTestHead(
  EMPTY_CONTINUE_HEAD,
  EMPTY_BREAK_HEAD,
);
export const isFullLabel = generateTestHead(
  FULL_CONTINUE_HEAD,
  FULL_BREAK_HEAD,
);
