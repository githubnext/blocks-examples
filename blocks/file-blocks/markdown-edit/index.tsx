import { FileBlockProps } from "@githubnext/blocks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { tw } from "twind";

import { EditorState } from "@codemirror/state";
import { EditorView, Rect } from "@codemirror/view";
import { Block } from "@githubnext/blocks";
import { vim } from "@replit/codemirror-vim";
import nodeEmoji from "node-emoji";
import { highlightActiveLine } from "./highlightActiveLine";
import "./style.css";
import WidgetPicker from "./WidgetPicker";
import {
  vimModeCompartment,
  isEditableCompartment,
  makeExtensions,
} from "./extensions";

export default function (props: FileBlockProps) {
  const {
    content,
    context,
    isEditable,
    onUpdateContent,
    onRequestBlocksRepos,
  } = props;

  const parsedContent = useMemo(
    () =>
      nodeEmoji
        .emojify(content, (name) => name)
        // remove comments
        .replace(/<!--[\s\S]*?-->/g, ""),
    [content]
  );

  const editorRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUsingVim, setIsUsingVim] = useState(false);
  const currentSearchTerm = useRef(searchTerm);
  useEffect(() => {
    currentSearchTerm.current = searchTerm;
  }, [searchTerm]);
  const [autocompleteLocation, setAutocompleteLocation] = useState<Rect | null>(
    null
  );
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
  const onSelectAutocompleteFocusedBlock = useRef(() => {});
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
    if (doc !== parsedContent) {
      view.dispatch({
        changes: { from: 0, to: doc.length, insert: parsedContent },
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
      doc: parsedContent,
      extensions: makeExtensions({
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
      }),
    });
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
  }, []);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    view.dispatch({
      effects: isEditableCompartment.reconfigure([
        EditorView.editable.of(isEditable),
        isEditable ? highlightActiveLine() : [],
      ]),
    });
  }, [isEditable]);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    view.dispatch({
      effects: vimModeCompartment.reconfigure(isUsingVim ? vim() : []),
    });
    viewRef.current.focus();
  }, [isUsingVim]);

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

      {isEditable && (
        <button
          className={tw`absolute top-3 right-3 z-50 appearance-none`}
          style={{
            opacity: isUsingVim ? 1 : 0.5,
            filter: isUsingVim ? "" : "grayscale(100%)",
          }}
          title={isUsingVim ? "Disable Vim Mode" : "Enable Vim Mode"}
          onClick={() => {
            setIsUsingVim(!isUsingVim);
          }}
        >
          {/* the vim logo */}
          <svg width="2em" viewBox="0 0 544.8642 544.8642">
            <g transform="translate(-69.980994,-160.33288) matrix(1.532388,0,0,1.3939671,-54.912136,-41.792396)">
              <path
                d="M 260.50744,170.69515 105.98412,340.79094 259.8636,510.178 414.38691,340.08221 260.50744,170.69515 z"
                fill="#019833"
              ></path>
              <path
                transform="matrix(0.90138601,0,0,0.99222542,-437.42287,-185.30615)"
                d="m 828.9375,369.5 -4.28125,4.28125 0,15.71875 3.75,3.75 19.8125,0 0,15.1875 -131.0625,132.84375 0,-147.84375 21.78125,0 4.46875,-4.46875 0,-15.90625 -4.125,-3.1875 -114.625,0 -3.75,3.75 0,16.25 3.8125,3.8125 19.9375,0 0,272.25 3.75,3.75 22.65625,0 274.65625,-283.40625 0,-12.5 -4.28125,-4.28125 -112.5,0 z"
                fill="#cccccc"
              ></path>
            </g>
          </svg>
        </button>
      )}

      <div
        className={tw(`relative w-full h-[30em]`)}
        key={context.path}
        ref={editorRef}
      />
    </div>
  );
}
