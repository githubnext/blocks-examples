import "./style.css";
import React from "react";
import { FileBlockProps } from "@githubnext/utils";

import {
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { history, historyKeymap } from "@codemirror/history";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { indentOnInput } from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { lintKeymap } from "@codemirror/lint";
import { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";

const languageConf = new Compartment();

let doc: string;

const extensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...commentKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),

  languageConf.of([]),

  EditorView.updateListener.of((v) => {
    if (!v.docChanged) return;
    doc = v.state.doc.sliceString(0);
  }),
];

export default function (props: FileBlockProps) {
  const {
    content,
    context: { path },
    onRequestUpdateContent,
  } = props;

  doc = content;
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!editorRef.current) return;
    const state = EditorState.create({
      doc: content,
      extensions,
    });
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    const language = LanguageDescription.matchFilename(languages, path);

    if (language) {
      language.load().then((lang) => {
        view.dispatch({
          effects: languageConf.reconfigure(lang),
        });
      });
    }
  }, []);

  return (
    <div className="position-relative height-full">
      <div
        className="width-full height-full overflow-auto"
        key={content}
        ref={editorRef}
      />
      <button
        className="btn btn-primary position-absolute right-4 top-4 z-10"
        style={{ zIndex: 1 }}
        onClick={() => onRequestUpdateContent(doc)}
      >
        Save Changes
      </button>
    </div>
  );
}
