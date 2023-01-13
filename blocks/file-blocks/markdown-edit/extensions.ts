import { FileBlockProps } from "@githubnext/blocks";
import React from "react";

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  Compartment,
  EditorState,
  Extension,
  TransactionSpec,
} from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  Rect,
  ViewUpdate,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import interact from "@replit/codemirror-interact";
import { blockComponentWidget } from "./block-component-widget";
import { copy, markdownKeymap, pasteKeymap } from "./copy-widget";
import { images } from "./image-widget";
import "./style.css";
import { theme } from "./theme";

export const vimModeCompartment = new Compartment();
export const isEditableCompartment = new Compartment();

export function makeExtensions({
  props,
  onDispatchChanges,
  context,
  onScrollTo,
  isAutocompleting,
  onDiffAutocompleteFocusedBlockIndex,
  onSelectAutocompleteFocusedBlock,
  onUpdateContent,
  setSearchTerm,
  setAutocompleteLocation,
}: {
  props: FileBlockProps;
  onDispatchChanges: (changes: TransactionSpec) => void;
  context: any;
  onScrollTo: (pos: number) => void;
  isAutocompleting: React.RefObject<boolean>;
  onDiffAutocompleteFocusedBlockIndex: React.RefObject<(index: number) => void>;
  onSelectAutocompleteFocusedBlock: React.RefObject<() => void>;
  onUpdateContent: (content: string) => void;
  setSearchTerm: (term: string) => void;
  setAutocompleteLocation: (location: Rect | null) => void;
}): Extension[] {
  return [
    vimModeCompartment.of([]),
    isEditableCompartment.of([]),
    blockComponentWidget({ parentProps: props, onDispatchChanges }),
    copy({ context, onScrollTo }),
    images({ context }),
    keymap.of([
      // prevent default behavior for arrow keys when autocompleting
      {
        key: "ArrowDown",
        run: () => {
          if (!isAutocompleting.current) return false;
          onDiffAutocompleteFocusedBlockIndex.current!(1);
          return true;
        },
      },
      {
        key: "ArrowUp",
        run: () => {
          if (!isAutocompleting.current) return false;
          onDiffAutocompleteFocusedBlockIndex.current!(-1);
          return true;
        },
      },
      {
        key: "Enter",
        run: () => {
          if (!isAutocompleting.current) return false;
          onSelectAutocompleteFocusedBlock.current!();
          return true;
        },
      },
    ]),

    EditorView.updateListener.of((v) => {
      if (!v.docChanged) return;
      onUpdateContent(v.state.doc.sliceString(0));
      window.state = v.state;
    }),

    EditorView.updateListener.of((v: ViewUpdate) => {
      if (v.docChanged || v.selectionChanged) {
        const cursorPosition = v.state.selection.ranges[0].to;
        const text = v.state.doc.sliceString(0, cursorPosition);
        const activeLine = text.split("\n").slice(-1)[0];
        const startOfLinePosition = cursorPosition - activeLine.length;

        const isAutocompleting =
          activeLine.startsWith("/") && !activeLine.includes("/>");
        if (!isAutocompleting) {
          setSearchTerm("");
          setAutocompleteLocation(null);
          return;
        }
        if (!v.view) return;
        const cursorLocation = v.view.coordsAtPos(startOfLinePosition);
        const scrollOffset = -v.view.contentDOM.getBoundingClientRect().top;
        cursorLocation["top"] += scrollOffset;
        setAutocompleteLocation(cursorLocation);
        setSearchTerm(activeLine.slice(1));
      }
    }),

    EditorView.domEventHandlers({
      paste(e, view) {
        const value = e.clipboardData?.items[0];
        const MAX_URL_SIZE = 5000000;
        // handle images pasted from the web
        if (value && value.type === "text/html") {
          value.getAsString((str) => {
            const htmlImgRegex = /<img[^>]*src="(?<src>[^"]*)"[^>]*>/gim;
            const matches = [...str.matchAll(htmlImgRegex)];
            const images = matches.map((match) => match.groups?.src);
            if (images) {
              view.dispatch({
                changes: {
                  from: view.state.selection.main.from,
                  to: view.state.selection.main.to,
                  insert: images
                    .filter((image) => image && image.length < MAX_URL_SIZE)
                    .map((image) => `![${image}](${image})`)
                    .join("\n"),
                },
              });
            }
          });
        } else if (
          value &&
          ["image/png", "image/jpeg"].includes(value.type || "")
        ) {
          const file = value.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const image = e.target?.result as string;
              if (image && image.length < MAX_URL_SIZE) {
                view.dispatch({
                  changes: {
                    from: view.state.selection.main.from,
                    to: view.state.selection.main.to,
                    insert: `![${file.name}](${image})`,
                  },
                });
              }
            };
            reader.readAsDataURL(file);
          }
        }
      },
    }),

    // lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    // taking folding out for now
    // foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    // syntaxHighlighting(defaultHighlightStyle),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    highlightSelectionMatches(),

    theme,

    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      extensions: [
        {
          defineNodes: [
            {
              name: "URL",
              style: tags.url,
            },
          ],
          parseInline: [
            {
              name: "URL",
              parse(cx, next, start) {
                const fullText = cx.slice(start, cx.end);
                const prev = cx.text.slice(start - 1, start);
                let match;
                if (
                  next != 104 /* 'h' */ ||
                  [" ", "\n", "\t"].includes(prev) ||
                  !(match = /^https?:\/\/.*/.exec(fullText))
                )
                  return -1;
                const hasIncludedLink = match[0].indexOf("](http") !== -1;
                if (hasIncludedLink) return -1;
                const firstMatch = match[0];
                if (!firstMatch) return -1;
                return cx.addElement(
                  cx.elt("URL", start, start + 1 + firstMatch.length)
                );
              },
            },
          ],
        },
      ],
    }),
    interact({
      rules: [
        // dragging numbers
        {
          regexp: /-?\b\d+\.?\d*\b/g,
          cursor: "ew-resize",
          onDrag: (text, setText, e) => {
            const newVal = Number(text) + e.movementX;
            if (isNaN(newVal)) return;
            setText(newVal.toString());
          },
        },
      ],
    }),

    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      // taking folding out for now
      // ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
      ...markdownKeymap,
    ]),
  ];
}
