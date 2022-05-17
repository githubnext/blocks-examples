import { tw } from "twind";
import { useEffect, useMemo, useState } from "react";
import { Block, FolderBlockProps } from "@githubnext/blocks";
import Select from "react-select";
import { Box, Button, IconButton } from "@primer/react";
import { TrashIcon } from "@primer/octicons-react";

// Note: We're using a BlockComponent prop here to create nested Blocks.
// This is only implemented for our own example Blocks, to showcase the concept.

export default function (props: FolderBlockProps) {
  const {
    tree,
    metadata = {},
    onUpdateMetadata,
    BlockComponent,
    onRequestBlocksRepos,
  } = props;
  const [blockOptions, setBlockOptions] = useState<Block[]>([]);
  const [blocks, setBlocks] = useState<any>(metadata?.blocks || defaultBlocks);
  useEffect(() => setBlocks(metadata?.blocks || blocks), [metadata]);
  const pathOptions = useMemo(
    () => [
      { value: "", label: "/" },
      ...tree.map((d) => ({ value: d.path, label: d.path })),
    ],
    [tree]
  );
  const blockOptionsByType = {
    folder: blockOptions.filter((block) => block.type === "folder"),
    file: blockOptions.filter((block) => block.type === "file"),
  };
  const isDirty =
    JSON.stringify(blocks) !== JSON.stringify(metadata?.blocks || blocks);

  const getPathType = (path: string) => {
    const item = tree.find((d) => d.path === path) || {};
    return item.type === "blob" ? "file" : "folder";
  };

  const getRelevantBlockOptions = (path: string) => {
    const type = getPathType(path);
    const extension = path.split(".").pop();
    return blockOptionsByType[type].filter(
      (block: any) =>
        !block.extensions ||
        block.extensions?.includes("*") ||
        block.extensions?.includes(extension)
    );
  };

  const getBlocks = async () => {
    const blocksRepos = await onRequestBlocksRepos();
    const exampleBlocks =
      blocksRepos.find(
        (repo) => repo.full_name === "githubnext/blocks-examples"
      )?.blocks || [];
    setBlockOptions(
      exampleBlocks.map((block) => ({
        ...block,
        owner: "githubnext",
        repo: "blocks-examples",
      }))
    );
  };
  useEffect(() => {
    getBlocks();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "calc(100% - 1em)",
        height: "100%",
        display: "flex",
        flexWrap: "wrap",
        padding: "0.5em 2em 0.5em 0.5em",
      }}
    >
      {blocks.map((block: any, index: number) => (
        <Box
          borderColor="border.default"
          borderWidth={1}
          borderStyle="solid"
          borderRadius={4}
          sx={{
            margin: "0.5em",
            flex: "1",
            minHeight: 0,
            minWidth: "calc(50% - 4em)",
            maxHeight: "calc(100% - 1em)",
            overflow: "hidden",
          }}
        >
          <Box
            bg="canvas.subtle"
            borderColor="border.default"
            borderStyle="solid"
            borderBottomWidth={1}
            key={index}
            className={tw(`Box-header flex p-2`)}
          >
            <div>
              <Select
                options={pathOptions}
                value={pathOptions.find((d) => d.value === block.path)}
                styles={selectStyles}
                onChange={(newValue: any) => {
                  const path = newValue.value;
                  const newBlocks = [...blocks];
                  newBlocks[index] = { ...newBlocks[index], path: path };
                  const newBlockOptions = getRelevantBlockOptions(path);
                  if (!newBlockOptions.find((d: any) => d.id === block.id)) {
                    const newBlock = newBlockOptions[0];
                    newBlocks[index] = { ...newBlocks[index], block: newBlock };
                  }
                  setBlocks(newBlocks);
                }}
              />
            </div>
            <div
              style={{
                marginLeft: "auto",
              }}
            >
              <Select
                options={getRelevantBlockOptions(block.path) || []}
                value={block.block}
                getOptionValue={(block) => block.id}
                getOptionLabel={(block) => block.title}
                formatOptionLabel={(block) => {
                  return <div>{block.title}</div>;
                }}
                styles={selectStyles}
                onChange={(newValue) => {
                  const newBlocks = [...blocks];
                  newBlocks[index] = { ...newBlocks[index], block: newValue };
                  setBlocks(newBlocks);
                }}
              />
            </div>
            <div
              className={tw(
                `flex items-center justify-center ml-2 flex-shrink-0`
              )}
            >
              <IconButton
                variant="danger"
                onClick={() => {
                  const newBlocks = [...blocks];
                  newBlocks.splice(index, 1);
                  setBlocks(newBlocks);
                }}
                icon={TrashIcon}
              ></IconButton>
            </div>
          </Box>
          {!block.block ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#F6F8FA",
              }}
            ></div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                flex: 1,
                overflow: "auto",
              }}
            >
              {BlockComponent ? (
                <BlockComponent
                  {...props}
                  block={block.block}
                  path={block.path}
                />
              ) : (
                "No BlockComponent"
              )}
            </div>
          )}
        </Box>
      ))}
      <Button
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          top: "1.5em",
          right: "-0.2em",
          padding: "0.4em",
        }}
        onClick={() => {
          const newBlock = {
            path: pathOptions[0].value,
            block: blockOptionsByType["folder"][0],
          };
          const newBlocks = [...blocks, newBlock];
          setBlocks(newBlocks);
        }}
      >
        <svg
          width="1.3em"
          height="1.3em"
          viewBox="0 0 16 16"
          className={tw(`bi bi-plus`)}
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"
          />
          <path
            fillRule="evenodd"
            d="M7.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8z"
          />
        </svg>
      </Button>
      {isDirty && (
        <button
          style={{
            background: "#0A69DA",
            color: "#fff",
            height: "2em",
            width: "2em",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: "3.9em",
            right: "-0.2em",
          }}
          onClick={() => {
            const newMetadata = {
              blocks,
            };
            onUpdateMetadata(newMetadata);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.2em"
            height="1.2em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}
const selectStyles = {
  // @ts-ignore
  menu: (provided, state) => ({
    ...provided,
    width: "auto",
    minWidth: "100%",
    zIndex: 1000,
  }),
  // @ts-ignore
  input: (provided, state) => ({
    ...provided,
    minWidth: "8em",
  }),
};

const defaultBlocks = [
  {
    block: {
      type: "folder",
      id: "minimap-block",
      title: "Minimap",
      description: "A visualization of your folders and files",
      entry: "/src/blocks/folder-blocks/minimap/index.tsx",
      owner: "githubnext",
      repo: "blocks-examples",
    },
    path: "",
  },
];
