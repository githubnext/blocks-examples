import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import primer from "@primer/primitives";

const colors = primer.colors.light.codemirror;

export const oneDarkTheme = EditorView.theme(
  {
    "&": {
      color: colors.text,
      backgroundColor: colors.bg,
    },

    ".cm-content": {
      caretColor: colors.cursor,
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: colors.cursor },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: colors.selectionBg },

    ".cm-panels": { backgroundColor: colors.linesBg, color: colors.text },
    ".cm-panels.cm-panels-top": {
      borderBottom: `2px solid ${colors.guttersBg}`,
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: `2px solid ${colors.guttersBg}`,
    },

    ".cm-searchMatch": {
      backgroundColor: colors.selectionBg,
      outline: `1px solid ${colors.selectionBg}`,
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#6199ff2f",
    },

    ".cm-activeLine": { backgroundColor: colors.activelineBg },
    ".cm-selectionMatch": { backgroundColor: colors.selectionBg },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: colors.selectionBg,
      outline: `1px solid ${colors.selectionBg}`,
    },

    ".cm-gutters": {
      backgroundColor: colors.guttersBg,
      color: colors.guttermarkerSubtleText,
      border: "none",
    },

    ".cm-activeLineGutter": {
      backgroundColor: colors.activelineBg,
    },

    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      border: "none",
      color: colors.guttermarkerText,
    },

    ".cm-tooltip": {
      border: "none",
      backgroundColor: colors.bg,
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: colors.bg,
      borderBottomColor: colors.bg,
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: colors.selectionBg,
        color: colors.text,
      },
    },
    ".cm-fat-cursor": {
      background: `${colors.selectionBg} !important`,
    },
    "&:not(.cm-focused) .cm-fat-cursor": {
      outline: `solid 1px ${colors.selectionBg} !important`,
    },
    ".cm-indentation-marker": {
      opacity: 0.3,
    },
  },
  { dark: true }
);

export const oneDarkHighlightStyle = HighlightStyle.define([
  {
    tag: t.keyword,
    color: colors.syntax.keyword,
  },
  {
    tag: [t.deleted, t.character, t.propertyName, t.macroName],
    color: colors.syntax.constant,
  },
  {
    tag: [t.function(t.variableName), t.labelName],
    color: colors.syntax.entity,
  },
  {
    tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: colors.syntax.string,
  },
  {
    tag: [
      t.operator,
      t.operatorKeyword,
      t.url,
      t.escape,
      t.regexp,
      t.link,
      t.special(t.string),
    ],
    color: colors.syntax.string,
  },
  {
    tag: [t.meta, t.comment],
    color: colors.syntax.comment,
  },
  {
    tag: t.strong,
    fontWeight: "bold",
  },
  {
    tag: t.emphasis,
    fontStyle: "italic",
  },
  {
    tag: t.strikethrough,
    textDecoration: "line-through",
  },
  {
    tag: t.link,
    color: colors.syntax.string,
    textDecoration: "underline",
  },
  {
    tag: t.heading,
    fontWeight: "bold",
    color: colors.syntax.string,
  },
  {
    tag: [t.atom, t.bool, t.special(t.variableName)],
    color: colors.syntax.keyword,
  },
  {
    tag: [t.processingInstruction, t.string, t.inserted],
    color: colors.syntax.string,
  },
  {
    tag: [t.special(t.variableName), t.special(t.propertyName)],
    color: colors.syntax.keyword,
  },
  {
    tag: t.angleBracket,
    color: colors.syntax.constant,
  },
  {
    tag: t.invalid,
    color: colors.syntax.support,
  },
]);

export const theme: Extension = [
  oneDarkTheme,
  syntaxHighlighting(oneDarkHighlightStyle),
];
