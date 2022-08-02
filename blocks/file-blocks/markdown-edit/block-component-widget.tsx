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
  FormControl,
  ThemeProvider,
} from "@primer/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { tw } from "twind";

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
    createRoot(container).render(
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
    return JSON.stringify(this.props) === JSON.stringify(_widget.props);
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
    // starts with any number of #

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
              eval(`window.parsedValue = ${valueString.trim().slice(1, -1)}`);
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
      if (transaction.docChanged) {
        return decorate(transaction.state);
      }

      return copys.map(transaction.changes);
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
  props: Partial<FullProps>;
  onChangeProps: (newProps: Partial<FullProps>) => void;
}) => {
  const BlockComponent = parentProps.BlockComponent;

  return (
    // @ts-ignore
    <ThemeProvider>
      <BaseStyles
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <div className={tw("h-full w-full pr-2 -my-5")}>
          <div className={tw("h-full w-full bg-white border border-gray-200")}>
            <ContextControls
              props={props}
              onChangeProps={onChangeProps}
              parentProps={parentProps}
            />
            <Box className={tw("w-full h-[30em] overflow-auto")}>
              <BlockComponent {...props} />
            </Box>
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch();
      setIsLoading(false);
      setData(res);
      setError(null);
    } catch (e) {
      setIsLoading(false);
      setError(e);
    }
  };
  useEffect(() => {
    fetchData();
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

  const currentSearchTermRepos = useRef<string>("");
  const contentRepo = `${combinedContext.owner}/${combinedContext.repo}`;
  const onFetchRepos = useCallback(
    async (searchTerm: string) => {
      currentSearchTermRepos.current = searchTerm;
      const repos = await parentProps.onRequestGitHubData(
        "/search/repositories",
        {
          sort: "stars",
          direction: "desc",
          per_page: 10,
          q: searchTerm || "blocks",
        }
      );
      if (currentSearchTermRepos.current !== searchTerm) return;
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

  const currentSearchTermPaths = useRef<string>("");
  const onFetchRepoPaths = useCallback(
    async (searchTerm: string) => {
      currentSearchTermPaths.current = searchTerm;
      const paths = await parentProps.onRequestGitHubData(
        `/repos/${contentRepo}/contents`,
        {
          per_page: 100,
        }
      );
      if (currentSearchTermPaths.current !== searchTerm) return;
      const repoPaths = paths
        .filter(
          (path) =>
            !props.block?.type ||
            (props.block?.type === "file" && path.type === "file") ||
            (props.block?.type === "folder" && path.type === "dir")
        )
        .map((path) => ({
          text: path.name,
          id: path.name,
          value: { path: path.name },
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
