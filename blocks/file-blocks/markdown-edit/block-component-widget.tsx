import { syntaxTree } from "@codemirror/language";
import { Range, RangeSet } from "@codemirror/rangeset";
import {
  EditorState,
  Extension,
  StateField,
  Text,
  TransactionSpec,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import {
  Block,
  BlockPicker,
  FileBlockProps,
  FolderBlockProps,
} from "@githubnext/blocks";
import {
  Autocomplete,
  BaseStyles,
  Box,
  Button,
  FormControl,
  ThemeProvider,
} from "@primer/react";
import React, {
  EventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { tw } from "twind";
import { useDebouncedCallback } from "use-debounce";

interface BlockParams {
  props: Record<string, any>;
  parentProps: FileBlockProps;
  onChangeProps: (props: Partial<FileBlockProps | FolderBlockProps>) => void;
}

class BlockWidget extends WidgetType {
  readonly props = {};
  readonly parentProps = null as any;
  readonly onChangeProps = (newProps) => {};

  constructor({ parentProps, props, onChangeProps }: BlockParams) {
    super();
    this.parentProps = parentProps;
    this.props = props;
    this.onChangeProps = onChangeProps;
  }

  toDOM() {
    const container = document.createElement("div");
    container.classList.add("BlockComponent");
    const parentProps = this.parentProps;
    const BlockComponent = parentProps.BlockComponent;
    if (!BlockComponent) return container;
    ReactDOM.createRoot(container).render(
      <BlockComponentWrapper
        parentProps={parentProps}
        props={this.props}
        onChangeProps={this.onChangeProps}
      />
    );

    return container;
  }

  updateDOM(_dom: HTMLElement): boolean {
    return false;
  }

  eq(_widget: WidgetType): boolean {
    const removeUnnecessaryProps = (props: Record<string, any>) => {
      const { height, ...rest } = props;
      return rest;
    };
    return (
      JSON.stringify(removeUnnecessaryProps(this.props)) ===
      JSON.stringify(removeUnnecessaryProps(_widget.props))
    );
  }

  ignoreEvent(_event: Event): boolean {
    return true;
  }
}

export const blockComponentWidget = ({
  parentProps,
  onDispatchChanges,
}: {
  parentProps: FileBlockProps;
  onDispatchChanges: (changes: TransactionSpec) => void;
}): Extension => {
  const blockComponentDecoration = (BlockParams: BlockParams) =>
    Decoration.replace({
      widget: new BlockWidget(BlockParams),
    });

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
      enter: (type, from, to) => {
        let text = state.doc.sliceString(from, to);
        if (type.name === "Document") return;

        const locationOfCloseTag = text.indexOf("/>");
        to = from + locationOfCloseTag + 2;

        const blockComponentRegex = /\<BlockComponent[\s\S\n]/;
        const isBlockComponent = blockComponentRegex.test(text);
        if (isBlockComponent) {
          const blockComponentPropsRegex =
            /(?!\<BlockComponent[\s\S\n]*)([\s\S\n]*?)(?=\/\>)/;
          const propsString = blockComponentPropsRegex
            .exec(text)?.[0]
            .split("BlockComponent")[1];
          if (!propsString) return;
          let props = {};
          const propsArray = propsString.split("=");
          let runningLastPropKey = "";
          propsArray.forEach((prop, index) => {
            const lastWordInString =
              prop.split(/\s+/)[prop.split(/\s+/).length - 1];
            const key = runningLastPropKey;
            runningLastPropKey = lastWordInString;
            // slice lastWordInString from end
            const valueString = prop.slice(
              0,
              prop.length - lastWordInString.length
            );
            if (!key || !valueString) return;

            // TODO: extract props from string in a more robust way
            try {
              eval(
                `window.parsedValue = ${valueString
                  .trim()
                  // remove start and end curly braces
                  .replace(/^\{|\}$/g, "")}`
              );
              props[key] = window.parsedValue;
            } catch (e) {
              props[key] = valueString;
            }
          });

          const onChangeProps = (newProps: any) => {
            const newString = `<BlockComponent
  ${Object.keys(newProps)
    .map((key) => `${key}={${JSON.stringify(newProps[key])}}`)
    .join("\n")}
/>`;

            onDispatchChanges({
              changes: {
                from,
                to,
                insert: Text.of([newString]),
              },
            });
          };
          const newDecoration = blockComponentDecoration({
            parentProps,
            props,
            onChangeProps,
          });
          widgets.push(newDecoration.range(from, to));
        }
      },
    });

    if (!widgets.length) return Decoration.none;

    return RangeSet.of(widgets);
  };

  const theme = EditorView.baseTheme({});

  const field = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state);
    },
    update(copys, transaction) {
      // if (transaction.docChanged) {
      return decorate(transaction.state);
      // }

      // return copys.map(transaction.changes);
    },
    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  return [theme, field];
};

const BlockComponentWrapper = ({
  parentProps,
  props,
  onChangeProps,
}: {
  parentProps: FileBlockProps;
  props: Partial<FullProps> & { height?: number };
  onChangeProps: (newProps: Partial<FullProps> & { height?: number }) => void;
}) => {
  const resizingStart = useRef<number | null>(null);
  const [resizingHeight, setResizingHeight] = useState<number | undefined>(
    undefined
  );

  const resizingHeightRef = useRef<number | undefined>(undefined);
  const eventHandlers = useRef<[string, (e: any) => void][]>([]);
  useEffect(() => {
    resizingHeightRef.current = resizingHeight;
  }, [resizingHeight]);
  const BlockComponent = parentProps.BlockComponent;

  // so we don't have to re-render
  const [overrideHeight, setOverrideHeight] = useState<number | undefined>(
    props.height
  );
  useEffect(() => {
    setOverrideHeight(props.height);
  }, [props.height]);

  useEffect(() => {
    return () => {
      eventHandlers.current.forEach((handler) => {
        window.removeEventListener(handler[0], handler[1]);
      });
    };
  }, []);

  return (
    // @ts-ignore
    <ThemeProvider>
      <BaseStyles
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <div className={tw("relative h-full w-full pr-2 -my-5 mb-2")}>
          <div className={tw("h-full w-full bg-white border border-gray-200")}>
            <ContextControls
              props={props}
              onChangeProps={onChangeProps}
              parentProps={parentProps}
            />
            <Box
              className={tw("w-full  overflow-auto")}
              style={{
                height: resizingHeight || overrideHeight || props.height || 300,
              }}
            >
              <BlockComponent {...props} />
              {!!resizingHeight && (
                // to keep the pointer events in this window
                <div className={tw("absolute inset-0")} />
              )}
            </Box>
            <Box
              className={tw(
                "cursor-ns-resize h-2 w-full bg-grey-100 absolute bottom-0 transform translate-y-full"
              )}
              onMouseDown={(e) => {
                const { clientY } = e;
                resizingStart.current = clientY;

                const onMouseMove = (e) => {
                  if (!resizingStart.current) return;
                  const { clientY } = e;
                  const diff = clientY - resizingStart.current;
                  setResizingHeight(
                    (overrideHeight || props.height || 300) + diff
                  );
                };
                const onMouseUp = () => {
                  onChangeProps({
                    ...props,
                    height: resizingHeightRef.current,
                  });
                  setOverrideHeight(resizingHeightRef.current);
                  setResizingHeight(undefined);
                  resizingStart.current = null;
                  window.removeEventListener("mousemove", onMouseMove);
                  window.removeEventListener("mouseup", onMouseUp);
                };
                eventHandlers.current = [
                  ["mousemove", onMouseMove],
                  ["mouseup", onMouseUp],
                ];
                window.addEventListener("mousemove", onMouseMove);
                window.addEventListener("mouseup", onMouseUp);
              }}
            />
          </div>
        </div>
      </BaseStyles>
    </ThemeProvider>
  );
};

type FullProps = (FileBlockProps | FolderBlockProps) & {
  block: Block;
};

const useOnRequestData = (
  fetch: () => Promise<any>
): {
  data: any;
  isLoading: boolean;
  error: any;
} => {
  const [data, setData] = useState<any>();
  const [error, setError] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const iteration = useRef(0);

  const fetchData = async () => {
    setIsLoading(true);
    iteration.current++;
    try {
      const res = await fetch();
      if (iteration.current !== iteration.current) return;
      setIsLoading(false);
      setData(res);
      setError(null);
    } catch (e) {
      setIsLoading(false);
      setError(e);
    }
  };
  const fetchDataDebounced = useDebouncedCallback(fetchData, 500);
  useEffect(() => {
    fetchDataDebounced();
  }, [fetch]);

  return { data, error, isLoading };
};

const ContextControls = ({
  props,
  parentProps,
  onChangeProps,
}: {
  props: Partial<FullProps>;
  parentProps: FileBlockProps;
  onChangeProps: (newProps: Partial<FullProps>) => void;
}) => {
  const isSameRepoAsParent =
    `${parentProps.context?.owner}/${parentProps.context?.repo}` ===
    `${props.context?.owner}/${props.context?.repo}`;
  const combinedContext = {
    ...(parentProps.context || {}),
    ...(props.context || {}),
    sha: isSameRepoAsParent ? parentProps.context.sha : "HEAD",
  };
  const blocksRepo = `${(props.block || {}).owner}/${(props.block || {}).repo}`;

  const contentRepo = `${combinedContext.owner}/${combinedContext.repo}`;
  const onFetchRepos = useCallback(
    async (searchTerm: string) => {
      const repos = await parentProps.onRequestGitHubData(
        "/search/repositories",
        {
          sort: "stars",
          direction: "desc",
          per_page: 10,
          q: searchTerm || "blocks",
        }
      );
      const repoNames = repos.items.map((repo) => ({
        text: repo.full_name,
        id: repo.full_name,
        value: {
          owner: repo.owner.login,
          repo: repo.name,
          path: "",
        },
      }));
      return repoNames;
    },
    [parentProps.onRequestBlocksRepos, blocksRepo]
  );

  const onFetchRepoPaths = useCallback(
    async (searchTerm: string) => {
      const res = await parentProps.onRequestGitHubData(
        `/repos/${contentRepo}/git/trees/${combinedContext.sha}`,
        {
          per_page: 100,
          recursive: true,
        }
      );
      const repoPaths = res.tree
        .filter(
          (path) =>
            !props.block?.type ||
            (props.block?.type === "file" && path.type === "blob") ||
            (props.block?.type === "folder" && path.type === "tree")
        )
        .map((path) => ({
          text: path.path,
          id: path.path,
          value: { path: path.path },
        }));
      const rootPath =
        props.block?.type === "folder"
          ? { text: "/", id: "/", value: { path: "" } }
          : null;
      return [rootPath, ...repoPaths].filter((path) => {
        if (!path) return;
        const doesMatchValue = searchTerm === props.context?.path;
        if (doesMatchValue || !searchTerm) return true;
        return path.id?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    },
    [parentProps.onRequestBlocksRepos, blocksRepo]
  );

  return (
    <Box className="BlockComponentWrapper">
      <Box
        backgroundColor="canvas.inset"
        className={tw(
          "w-full px-5 py-2 flex items-center space-x-4 border-b border-gray-200"
        )}
      >
        <FormControl sx={{ flex: "0 1", position: "relative" }}>
          <FormControl.Label>Block</FormControl.Label>
          <BlockPicker
            value={props.block}
            onChange={(block) => {
              onChangeProps({ ...props, block });
            }}
            onRequestBlocksRepos={parentProps.onRequestBlocksRepos}
          >
            <div className={tw("w-full text-left")}>
              {props.block?.title || props.block?.id}
            </div>
          </BlockPicker>
        </FormControl>
        <Input
          label="Content Repo"
          value={contentRepo}
          itemSearchFunction={onFetchRepos}
          onChange={(newValue) => {
            onChangeProps({
              ...props,
              context: { ...combinedContext, ...newValue },
            });
          }}
        />
        <Input
          label="File Path"
          value={(props.context || {}).path}
          placeholder="/"
          itemSearchFunction={onFetchRepoPaths}
          onChange={(newValue) => {
            onChangeProps({
              ...props,
              context: { ...combinedContext, ...newValue },
            });
          }}
        />
      </Box>
    </Box>
  );
};

let runningI = 0;
const getUniqueId = (prefix = "") => {
  runningI++;
  return prefix + runningI;
};

const Input = ({
  value,
  placeholder,
  label,
  onChange,
  itemSearchFunction,
}: {
  value: string;
  label: string;
  placeholder?: string;
  onChange: (value: Record<string, any>) => void;
  itemSearchFunction: (searchTerm: string) => Promise<string[]>;
}) => {
  const [search, setSearch] = useState(value);
  const id = useMemo(() => getUniqueId("Input--"), []);
  const anchorElement = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const requestDataFunction = useCallback(
    async () => await itemSearchFunction(search),
    [itemSearchFunction, search]
  );
  const { data: items, isLoading } = useOnRequestData(requestDataFunction);

  return (
    <FormControl sx={{ flex: 1, position: "relative" }}>
      <FormControl.Label htmlFor={id}>{label}</FormControl.Label>
      <Autocomplete>
        <Autocomplete.Input
          ref={anchorElement}
          id={id}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.target.blur();
              // need to prevent clearing the input
              setTimeout(() => {
                // this doesn't work, for some reason
                // setSearch(value)
                e.target.value = value;
              });
            }
          }}
        />
        <div
          className={tw(
            "absolute bottom-0 left-0 right-0 whitespace-pre-wrap break-words min-w-[12em] z-50 bg-white max-h-[20em] overflow-auto shadow-xl transform translate-y-full rounded-lg " +
              "text-sm text-gray-500" // these only affect the empty message
          )}
          ref={anchorElement}
        >
          <Autocomplete.Menu
            width="100%"
            py={2}
            loading={isLoading}
            selectionVariant="single"
            items={items || []}
            selectedItemIds={[value]}
            aria-labelledby={id}
            onSelectedChange={(selectedItemIds) => {
              const ids = selectedItemIds.filter(Boolean);
              const id = ids.slice(-1)[0];
              onChange(id ? id.value : undefined);
            }}
            filterFn={() => true}
          />
        </div>
      </Autocomplete>
    </FormControl>
  );
};
