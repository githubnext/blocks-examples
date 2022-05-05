import { tw } from "twind";
import { FolderBlockProps, getNestedFileTree } from "@githubnext/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { Buffer } from "buffer";
import { FilePicker } from "./FilePicker";
import { useDrag } from "./useDrag";
import { Item } from "./Item";
import flatten from "lodash.flatten";
import "./index.css";
import { Button } from "@primer/react";

const width = 5000;
const height = 5000;
const defaultDimensions = [200, 100];
export default function (
  props: FolderBlockProps & {
    metadata: { items: ItemType[] };
  }
) {
  const {
    context,
    tree,
    metadata,
    BlockComponent,
    onUpdateMetadata,
    onRequestGitHubData,
  } = props;

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

  const [items, setItems] = useState<ItemType[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const files = useMemo(
    () => getNestedFileTree(tree)[0].children.filter((d) => d.type === "blob"),
    [tree]
  );

  const getFileContents = async (path: string) => {
    const url = `/repos/${context.owner}/${context.repo}/contents/${path}`;
    const data = await onRequestGitHubData(url);
    if (!data.content) {
      return;
    }
    const decodedContent = Buffer.from(data.content, "base64").toString("utf8");
    return decodedContent;
  };

  useEffect(() => {
    items.forEach(async (item) => {
      const path = item.path;
      if (!path) return;
      if (fileContents[path]) return;
      setFileContents((fileContents) => ({
        ...fileContents,
        [path]: "Loading...",
      }));
      const content = await getFileContents(path);
      if (!content) return;
      setFileContents((fileContents) => ({ ...fileContents, [path]: content }));
    });
  }, [items]);

  useEffect(() => {
    setItems(metadata.items || placeholderItems);
  }, [metadata]);

  const [blockOptions, setBlockOptions] = useState<any[]>([]);

  const getBlocks = async () => {
    const url = "https://blocks-marketplace.githubnext.com/api/blocks";
    const res = await fetch(url).then((res) => res.json());
    const exampleBlocks = res || [];
    setBlockOptions(
      flatten(
        exampleBlocks.map((blocksRepo: any) =>
          blocksRepo.blocks.map((block) => ({
            ...block,
            owner: blocksRepo.owner,
            repo: blocksRepo.repo,
          }))
        )
      ).map((block: Block) => ({
        ...block,
        key: getBlockKey(block),
      }))
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
            const newItems: ItemType[] = [
              ...items,
              {
                type: "text",
                text: "Hello World",
                position: [
                  width / 2 - defaultDimensions[0] / 2,
                  height / 2 - defaultDimensions[1] / 2,
                ],
                dimensions: defaultDimensions,
              },
            ];
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
            const newItems: ItemType[] = [
              ...items,
              {
                type: "file",
                path: file.path,
                position: [width / 2 - 500 / 2, height / 2 - 360 / 2],
                dimensions: [500, 360],
                block: {
                  type: "file",
                  id: "code-block",
                  title: "Code block",
                  owner: "githubnext",
                  repo: "blocks-examples",
                  sandbox: false,
                  entry: "/src/blocks/file-blocks/code/index.tsx",
                },
              },
            ];
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
        {items.map((item: ItemType, index: number) => {
          return (
            <Item
              {...item}
              key={item.id || index} // to re-render text when placeholder is replaced
              contents={
                item.type === "file"
                  ? fileContents[item.path || ""] || "Loading file contents..."
                  : undefined
              }
              blockOptions={blockOptions}
              blockProps={props}
              BlockComponent={BlockComponent}
              onChange={(newContents: Partial<ItemType>) => {
                setItems((items) => {
                  const newItems = [...items].map((d) => ({ ...d }));
                  newItems[index] = {
                    ...newItems[index],
                    ...newContents,
                  };
                  return newItems;
                });
                setIsDirty(true);
              }}
              onDelete={() => {
                const newItems = [...items];
                newItems.splice(index, 1);
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

const placeholderItems = [
  {
    id: "placeholder",
    type: "text",
    text: "Start typing or grab a file",
    position: [
      width / 2 - defaultDimensions[0] / 2,
      height / 2 - defaultDimensions[1] / 2,
    ],
    dimensions: defaultDimensions,
  },
];

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
  id?: string;
  block?: Block;
  position: Position;
  dimensions: Dimensions;
};
export type Block = any;
export type Files = ReturnType<typeof getNestedFileTree>;
export type File = Files[0];
