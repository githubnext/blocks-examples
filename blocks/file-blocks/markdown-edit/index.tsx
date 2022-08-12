import { FileBlockProps } from "@githubnext/utils";
import { ActionList, ActionMenu, Box, Text } from "@primer/react";
import React, { useEffect, useRef, useState } from "react";
import { tw } from "twind";
import "./style.css";

import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { defaultKeymap } from "@codemirror/commands";
import { commentKeymap } from "@codemirror/comment";
import { highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { history, historyKeymap } from "@codemirror/history";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { indentOnInput } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { lintKeymap } from "@codemirror/lint";
import { bracketMatching } from "@codemirror/matchbrackets";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
  ViewUpdate,
} from "@codemirror/view";
import { Block } from "@githubnext/blocks";
import {
  InfoIcon,
  LinkExternalIcon,
  RepoIcon,
  VerifiedIcon,
} from "@primer/octicons-react";
import interact from "@replit/codemirror-interact";
import { blockComponentWidget } from "./block-component-widget";
import { copy, markdownKeymap } from "./copy-widget";
import { highlightActiveLine } from "./highlightActiveLine";
import { images } from "./image-widget";
import { theme } from "./theme";

// TODO: code block syntax highlighting

const extensions = [
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
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  highlightSelectionMatches(),

  markdown({
    base: markdownLanguage,
    codeLanguages: languages,
    // extensions: [GFM]
  }),
  theme,

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
];

export default function (props: FileBlockProps) {
  const {
    content,
    context,
    isEditable,
    onUpdateContent,
    onRequestBlocksRepos,
  } = props;

  const editorRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView>();
  const [searchTerm, setSearchTerm] = useState("");
  const currentSearchTerm = useRef(searchTerm);
  useEffect(() => {
    currentSearchTerm.current = searchTerm;
  }, [searchTerm]);
  const [autocompleteLocation, setAutocompleteLocation] =
    useState<DOMRect | null>(null);
  const [autocompleteFocusedBlockIndex, setAutocompleteFocusedBlockIndex] =
    useState<number>(0);
  const isAutocompleting = useRef(false);
  const autocompleteFocusedBlock = useRef<Block | null>(null);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  useEffect(() => {
    isAutocompleting.current = !!autocompleteLocation;
  }, [autocompleteLocation]);
  useEffect(() => {
    autocompleteFocusedBlock.current = blocks[autocompleteFocusedBlockIndex];
  }, [blocks, autocompleteFocusedBlockIndex]);

  const onDiffAutocompleteFocusedBlockIndex = useRef((diff: number) => {});
  useEffect(() => {
    onDiffAutocompleteFocusedBlockIndex.current = (diff: number) => {
      setAutocompleteFocusedBlockIndex(
        (i) => (i + diff + blocks.length) % blocks.length
      );
    };
  }, [blocks]);
  const onSelectAutocompleteFocusedBlock = useRef((diff: number) => {});
  useEffect(() => {
    onSelectAutocompleteFocusedBlock.current = () => {
      const view = viewRef.current;
      if (!view) return false;
      const { doc } = view.state;
      const { from, to } = view.state.selection.ranges[0];
      const previousText = doc.slice(0, from).toString();
      const activeLineText = previousText.split("\n").slice(-1)[0];
      const block = autocompleteFocusedBlock.current;
      if (!block) return false;
      const newText = `<BlockComponent
  block={{
    owner: "${block.owner}",
    repo: "${block.repo}",
    id: "${block.id}",
    type: "${block.type}",
  }}
/>`;
      view.dispatch({
        changes: {
          from: from - activeLineText.length,
          to,
          insert: newText,
        },
      });
      setAutocompleteLocation(null);
      setAutocompleteFocusedBlockIndex(0);
      setSearchTerm("");
    };
  }, [blocks]);

  const updateBlocks = async () => {
    setBlocks([]);
    setIsLoadingBlocks(true);
    const res = await onRequestBlocksRepos({
      searchTerm,
    });
    if (currentSearchTerm.current !== searchTerm) return;
    const blocks = res.reduce((acc, repo) => {
      return [...acc, ...repo.blocks];
    }, []);

    setBlocks(blocks);
    setIsLoadingBlocks(false);
  };

  useEffect(() => {
    updateBlocks();
  }, [searchTerm]);

  if (viewRef.current) {
    const view = viewRef.current;
    const doc = view.state.doc.sliceString(0);
    if (doc !== content) {
      view.dispatch({
        changes: { from: 0, to: doc.length, insert: content },
      });
    }
  }

  React.useEffect(() => {
    if (viewRef.current || !editorRef.current) return;
    const onDispatchChanges = (changes: any) => {
      if (viewRef.current) viewRef.current.dispatch(changes);
    };
    const onScrollTo = (pos: any) => {
      const view = viewRef.current;
      if (!view) return;
      // scroll to pos
      view.scrollPosIntoView(pos);
    };
    const state = EditorState.create({
      doc: content,
      extensions: [
        extensions,
        isEditable && highlightActiveLine(),
        blockComponentWidget({ parentProps: props, onDispatchChanges }),
        copy({ context, onScrollTo }),
        images({ context }),
        keymap.of([
          // prevent default behavior for arrow keys when autocompleting
          {
            key: "ArrowDown",
            run: () => {
              console.log(viewRef.current?.defaultLineHeight);
              if (!isAutocompleting.current) return false;
              onDiffAutocompleteFocusedBlockIndex.current(1);
              return true;
            },
          },
          {
            key: "ArrowUp",
            run: () => {
              if (!isAutocompleting.current) return false;
              onDiffAutocompleteFocusedBlockIndex.current(-1);
              return true;
            },
          },
          {
            key: "Enter",
            run: () => {
              if (!isAutocompleting.current) return false;
              onSelectAutocompleteFocusedBlock.current();
              return true;
            },
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          // taking folding out for now
          // ...foldKeymap,
          ...commentKeymap,
          ...completionKeymap,
          ...lintKeymap,
          ...markdownKeymap,
        ]),
        EditorView.editable.of(isEditable),
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
            // } else if (v.transactions[0]) {
          }
        }),
      ].filter(Boolean),
    });
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
  }, []);

  return (
    <div className={tw("relative w-full h-full")}>
      {!!autocompleteLocation && (
        <div
          className={tw("fixed top-[10em] left-[2em] z-50")}
          style={{
            transform: `translate(0, ${autocompleteLocation}px)`,
          }}
        >
          <WidgetPicker
            location={autocompleteLocation}
            focusedBlockIndex={autocompleteFocusedBlockIndex}
            blocks={blocks}
            isLoading={isLoadingBlocks}
            onFocus={setAutocompleteFocusedBlockIndex}
            onSelect={(index) => {
              setAutocompleteFocusedBlockIndex(index);
              onSelectAutocompleteFocusedBlock.current();
            }}
            onClose={() => {
              setAutocompleteLocation(null);
              setSearchTerm("");
            }}
          />
        </div>
      )}
      <div
        className={tw(`relative w-full h-[30em]`)}
        key={context.path}
        ref={editorRef}
      />
    </div>
  );
}

const WidgetPicker = ({
  location,
  isLoading,
  blocks,
  focusedBlockIndex,
  onClose,
  onSelect,
  onFocus,
}: {
  location?: DOMRect;
  isLoading: boolean;
  blocks: Block[];
  focusedBlockIndex: number;
  onClose: () => void;
  onFocus: (index: number) => void;
  onSelect: (index: number) => void;
}) => {
  return (
    <div className={tw("")}>
      <ActionMenu open={true} onChange={onClose}>
        <ActionMenu.Button className={tw("hidden !h-0")}>
          Open Actions Menu
        </ActionMenu.Button>
        <ActionMenu.Overlay
          top={(location?.top || 0) + 56}
          left={(location?.left || 0) - 10}
          width="large"
          sx={{ px: 2 }}
          onEscape={onClose}
          className={tw("max-h-[20em] overflow-auto")}
          onClickOutside={onClose}
        >
          {isLoading ? (
            <div className={tw("text-center w-full p-6 italic")}>
              <Text color="fg.subtle">Loading...</Text>
            </div>
          ) : !blocks.length ? (
            <div className={tw("text-center w-full p-6 italic")}>
              <Text color="fg.subtle">No Blocks found</Text>
            </div>
          ) : (
            <ActionList selectionVariant="single">
              <ActionList.Group title="Blocks" selectionVariant="single">
                {blocks.map((block, index) => {
                  const isExampleBlock =
                    [block.owner, block.repo].join("/") ===
                    `githubnext/blocks-examples`;
                  return (
                    // <div> because <button> steals the focus, even with tabIndex="-1" & preventFocusOnOpen
                    <div
                      className={tw(
                        "group w-full text-left bg-white px-4 py-2 cursor-pointer hover:bg-gray-100 focus:outline-none",
                        focusedBlockIndex === index
                          ? "bg-gray-100 rounded-md"
                          : "bg-transparent"
                      )}
                      onMouseEnter={() => onFocus(index)}
                      onClick={() => onSelect(index)}
                      key={[block.owner, block.repo, block.id].join("__")}
                    >
                      <div className={tw("flex justify-between text-sm")}>
                        <div className={tw("font-semibold")}>{block.title}</div>
                        {/* <div> because <a> steals the focus, even with tabIndex="-1" & preventFocusOnOpen */}
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            const url = `https://github.com/${block.owner}/${block.repo}`;
                            window.top?.open(url, "_blank");
                          }}
                          className={tw(
                            "text-xs mt-[2px] opacity-0 focus:opacity-100 group-hover:opacity-100"
                          )}
                          color="fg.muted"
                        >
                          <Text
                            className={tw("flex items-center")}
                            color="fg.muted"
                          >
                            View code
                            <LinkExternalIcon
                              className={tw("ml-1 opacity-50")}
                            />
                          </Text>
                        </div>
                      </div>

                      <Box className={tw("text-xs")} color="fg.muted">
                        <Box className={tw("flex items-center mt-1")}>
                          <Text className={tw("mr-1")} color="fg.muted">
                            <RepoIcon />
                          </Text>
                          <Text color="fg.muted" pb="1">
                            {block.owner}/{block.repo}
                            {isExampleBlock && (
                              <Text ml={1} color="ansi.blue">
                                <VerifiedIcon />
                              </Text>
                            )}
                          </Text>
                        </Box>
                        <div className={tw("flex items-start mt-1")}>
                          <div className={tw("mr-1")}>
                            <InfoIcon />
                          </div>
                          {block.description}
                        </div>
                      </Box>
                    </div>
                  );
                })}
              </ActionList.Group>
            </ActionList>
          )}
        </ActionMenu.Overlay>
      </ActionMenu>
    </div>
  );
};
