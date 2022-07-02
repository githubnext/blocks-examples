import { tw } from "twind";
import { Block, FolderBlockProps, getNestedFileTree } from "@githubnext/blocks";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilePicker } from "./FilePicker";
import { useDrag } from "./useDrag";
import { Item } from "./Item";
import flatten from "lodash.flatten";
import "./index.css";
import { Button } from "@primer/react";

const width = 5000;
const height = 5000;
const defaultDimensions: Dimensions = [200, 100];
export default function (
  props: FolderBlockProps & {
    metadata: { items: ItemType[] | { [id: number]: ItemType } };
  }
) {
  const {
    tree,
    metadata,
    BlockComponent,
    onUpdateMetadata,
    onRequestBlocksRepos,
  } = props;
  const nextId = useRef(0);

  const wrapperElement = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState<Dimensions>([-width / 2, -height / 2]);
  useEffect(() => {
    // onWheel needs to be in useEffect to make non-passive
    // to prevent scroll from changing pages (left/right)
    if (!wrapperElement?.current) return;
    const onWheel = (e: WheelEvent) => {
      setPan((pan) => {
        const newPan: Dimensions = [pan[0] - e.deltaX, pan[1] - e.deltaY];
        return newPan;
      });
      e.preventDefault();
    };

    wrapperElement?.current.addEventListener("wheel", onWheel, {
      passive: false,
    });
    return () => {
      if (!wrapperElement?.current) return;
      wrapperElement?.current.removeEventListener("wheel", onWheel);
    };
  }, []);

  const { isDragging } = useDrag(wrapperElement, pan, (newPan) => {
    const boundedDimensions: Dimensions = [
      Math.min(Math.max(newPan[0], -width), 0),
      Math.min(Math.max(newPan[1], -height), 0),
    ];
    setPan(boundedDimensions);
  });

  const [items, setItems] = useState<{ [id: number]: ItemType }>({});
  const [isDirty, setIsDirty] = useState(false);

  const files = useMemo(
    () => getNestedFileTree(tree)[0].children.filter((d) => d.type === "blob"),
    [tree]
  );

  useEffect(() => {
    let items = metadata.items || placeholderItems;
    if (Array.isArray(items)) {
      items = items.reduce(
        (items, item, id) => ({
          ...items,
          id: { ...item, id },
        }),
        {}
      );
    }
    nextId.current =
      Object.keys(items).reduce((max, curr) => Math.max(max, Number(curr)), 0) +
      1;
    setItems(items);
  }, [metadata]);

  const [blockOptions, setBlockOptions] = useState<Block[]>([]);

  const getBlocks = async () => {
    const blocksRepos = await onRequestBlocksRepos();
    const exampleBlocks = blocksRepos || [];
    setBlockOptions(
      flatten(exampleBlocks.map((blocksRepo) => blocksRepo.blocks)).map(
        (block) => ({
          ...block,
          key: getBlockKey(block),
        })
      )
    );
  };
  useEffect(() => {
    getBlocks();
  }, []);

  return (
    <div className={tw(`wrapper`)}>
      {/* add new item buttons */}
      <div className={tw(`absolute top-2 left-2 z-10 flex flex-col space-y-2`)}>
        {/* add text */}
        <Button
          onClick={() => {
            const id = nextId.current;
            nextId.current += 1;
            const newItems = {
              ...items,
              id: {
                id,
                type: "text",
                text: "Hello World",
                position: [
                  width / 2 - defaultDimensions[0] / 2,
                  height / 2 - defaultDimensions[1] / 2,
                ],
                dimensions: defaultDimensions,
              },
            };
            setItems(newItems);
            setIsDirty(true);
          }}
        >
          + Add text
        </Button>

        {/* add new file */}
        <FilePicker
          files={files}
          onFileSelected={(file) => {
            const id = nextId.current;
            nextId.current += 1;
            const newItems = {
              ...items,
              id: {
                id,
                type: "file",
                path: file.path,
                position: [width / 2 - 500 / 2, height / 2 - 360 / 2],
                dimensions: [500, 360],
                block: {
                  type: "file",
                  id: "code-block",
                  title: "Code block",
                  description: "A basic code block",
                  owner: "githubnext",
                  repo: "blocks-examples",
                  sandbox: false,
                  entry: "/src/blocks/file-blocks/code/index.tsx",
                },
              },
            };
            setItems(newItems);
            setIsDirty(true);
          }}
        />
      </div>

      {/* our canvas! */}
      <div
        className={tw(`canvas`)}
        style={{
          width: width,
          height: height,
          transform: `translate(${pan[0]}px, ${pan[1]}px)`,
        }}
      >
        {/* our scrolling & panning listener */}
        <div
          className={tw(
            `absolute top-[-50%] right-[-50%] bottom-[-50%] left-[-50%] pan`
          )}
          ref={wrapperElement}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
          }}
        />

        {/* our items */}
        {Object.values(items).map((item) => {
          return (
            <Item
              {...item}
              key={item.id} // to re-render text when placeholder is replaced
              blockOptions={blockOptions}
              BlockComponent={BlockComponent}
              onChange={(newContents: Partial<ItemType>) => {
                setItems({
                  ...items,
                  [item.id]: { ...items[item.id], ...newContents },
                });
                setIsDirty(true);
              }}
              onDelete={() => {
                const newItems = { ...items };
                delete newItems[item.id];
                setItems(newItems);
                setIsDirty(true);
              }}
            />
          );
        })}
      </div>

      {/* save button */}
      {isDirty && (
        <Button
          variant="primary"
          className={tw(`absolute top-2 right-2`)}
          onClick={() => {
            onUpdateMetadata({
              items,
            });
            setIsDirty(false);
          }}
        >
          Save changes
        </Button>
      )}
    </div>
  );
}

const placeholderItems = {
  0: {
    id: 0,
    type: "text",
    text: "Start typing or grab a file",
    position: [
      width / 2 - defaultDimensions[0] / 2,
      height / 2 - defaultDimensions[1] / 2,
    ],
    dimensions: defaultDimensions,
  },
};

export const roundToInterval = (n: number, interval: number) => {
  return Math.round(n / interval) * interval;
};

export const getBlockKey = (block: Block) =>
  `${block?.owner}/${block?.repo}__${block?.id}`.replace(/\//g, "__");
export const getMetadataPath = (block: Block, path: string) =>
  `.github/blocks/${block?.type}/${getBlockKey(block)}/${encodeURIComponent(
    path
  )}.json`;

export type Position = [number, number];
export type Dimensions = [number, number];
export type ItemType = {
  type: "file" | "text";
  path?: string;
  text?: string;
  url?: string;
  id: number;
  block?: Block;
  position: Position;
  dimensions: Dimensions;
};
export type BlockWithKey = Block & { key: string };
export type Files = ReturnType<typeof getNestedFileTree>;
export type File = Files[0];
