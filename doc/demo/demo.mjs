/** @type {Window} */

import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";

const { document, Worker } = globalThis;

const listExtension = () => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
  javascript(),
];

/**
 * @type {(
 *   initial: string,
 * ) => {
 *   editor: EditorView,
 *   element: HTMLElement,
 * }}
 */
const createEditor = (initial) => {
  const element = document.createElement("div");
  const editor = new EditorView({
    state: EditorState.create({
      doc: initial,
      extensions: listExtension(),
    }),
    parent: element,
  });
  return { element, editor };
};

/**
 * @type {(
 *   label: string,
 * ) => HTMLButtonElement}
 */
const createButton = (label) => {
  const button = document.createElement("button");
  button.style.marginRight = "1em";
  button.textContent = label;
  return button;
};

/**
 * @type {() => HTMLElement}
 */
const createLog = () => {
  const log = document.createElement("pre");
  log.tabIndex = 0; // make it focusable
  log.style.margin = "0px";
  log.style.borderWidth = "1px";
  log.style.borderStyle = "dotted";
  log.style.borderColor = "transparent";
  log.style.paddingLeft = "1em";
  log.addEventListener("focus", () => {
    log.style.borderColor = "gray";
  });
  // When the pre element loses focus
  log.addEventListener("blur", () => {
    log.style.borderColor = "transparent";
  });
  document.addEventListener("keydown", function (event) {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key === "a" &&
      document.activeElement === log
    ) {
      const selection = window.getSelection();
      if (selection) {
        event.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(log);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  });
  return log;
};

/**
 * @type {(
 *   config: {
 *     meta: string,
 *     base: string,
 *     worker: string,
 *     header_class: string,
 *   },
 * ) => HTMLElement}
 */
export const createDemo = (config) => {
  /** @type {null | Worker} */
  let worker = null;
  const meta = createEditor(config.meta);
  const base = createEditor(config.base);
  const play = createButton("Play");
  const stop = createButton("Stop");
  const clear = createButton("Clear");
  const log = createLog();
  stop.disabled = true;
  clear.addEventListener("click", (_event) => {
    log.textContent = "";
  });
  play.addEventListener("click", (_event) => {
    log.textContent = "";
    if (worker !== null) {
      worker.terminate();
    }
    worker = new Worker(config.worker, { type: "module" });
    worker.postMessage({
      meta: meta.editor.state.doc.toString(),
      base: base.editor.state.doc.toString(),
    });
    worker.addEventListener("message", ({ data }) => {
      log.textContent += `${data}\n`;
    });
    stop.disabled = false;
  });
  stop.addEventListener("click", (_event) => {
    if (worker !== null) {
      worker.terminate();
      worker = null;
    }
    stop.disabled = true;
  });
  {
    const main = document.createElement("div");
    {
      const head = document.createElement("div");
      head.style.marginBottom = "1em";
      head.className = config.header_class;
      head.appendChild(play);
      head.appendChild(stop);
      head.appendChild(clear);
      main.appendChild(head);
    }
    main.appendChild(document.createElement("hr"));
    {
      const body = document.createElement("div");
      body.style.display = "flex";
      body.style.flexWrap = "wrap";
      {
        const column1 = document.createElement("div");
        column1.style.flex = "1";
        column1.appendChild(base.element);
        body.appendChild(column1);
      }
      {
        const column2 = document.createElement("div");
        column2.style.flex = "1";
        column2.style.borderLeftColor = "black";
        column2.style.borderLeftStyle = "solid";
        column2.style.borderLeftWidth = "1px";
        column2.appendChild(log);
        body.appendChild(column2);
      }
      main.appendChild(body);
    }
    main.appendChild(document.createElement("hr"));
    main.appendChild(meta.element);
    return main;
  }
};
