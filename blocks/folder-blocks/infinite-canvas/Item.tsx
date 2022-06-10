import { tw } from "twind";
import { useMemo, useRef, useState } from "react";
import { useDrag } from "./useDrag";
import { BlockPicker } from "./BlockPicker";
import { ResizeButton } from "./ResizeButton";
import pm from "picomatch-browser";
import { roundToInterval, Position, ItemType, Dimensions } from "./index";
import { Box } from "@primer/react";

export const Item = ({
  type,
  text,
  path,
  url,
  block,
  blockProps,
  contents = "",
  position,
  dimensions,
  blockOptions = [],
  BlockComponent,
  onDelete,
  onChange,
}: ItemType & {
  contents?: string;
  blockOptions: any[];
  BlockComponent?: any;
  blockProps?: any;
  onDelete: () => void;
  onChange: (newContents: Partial<ItemType>) => void;
}) => {
  const [textBuffer, setTextBuffer] = useState(text);
  const headerElement = useRef<HTMLDivElement>(null);

  const { isDragging } = useDrag(
    headerElement,
    position,
    (newDimensions: Dimensions) => {
      onChange({
        position: newDimensions.map((d) =>
          roundToInterval(d, 10)
        ) as Dimensions,
      });
    }
  );

  const relevantBlockOptions = useMemo(() => {
    if (type !== "file") return null;
    const extension = path?.split(".").pop();
    return blockOptions.filter((block: any) => {
      // don't include example Blocks
      if (block.title === "Example File Block") {
        return false;
      }

      if (block.type !== type) return false;

      if (path === undefined) return true;

      if (Boolean(block.matches)) {
        return pm(block.matches, { bash: true, dot: true })(path);
      }

      if (block.extensions) {
        const extension = path.split(".").pop();
        return (
          block.extensions.includes("*") || block.extensions.includes(extension)
        );
      }

      return true;
    });
  }, [blockOptions, path, type]);

  const headerColor = {
    text: "bg-blue-50",
    file: "bg-red-50",
  }[type];
  const zIndex = {
    text: "z-30",
    file: "z-10",
  }[type];

  return (
    <Box
      borderColor="border.default"
      borderWidth={1}
      borderStyle="solid"
      className={tw(`item group shadow ${zIndex}`)}
      style={{
        width: dimensions[0],
        height: dimensions[1],
        transform: `translate(${position[0]}px, ${position[1]}px)`,
      }}
    >
      {/* grabby header */}
      <div
        className={tw(`${headerColor} h-full w-full flex-none`)}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
        ref={headerElement}
      />

      <div className={tw(`px-3 py-2 w-full overflow-auto`)}>
        {type === "text" ? (
          <div
            className={tw(
              `Text focus:outline-none cursor-text w-full h-full text-sm`
            )}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange({ text: e.target?.innerText || "" })}
            onBlur={() => {
              setTextBuffer(text);
            }}
          >
            {textBuffer}
          </div>
        ) : type === "file" ? (
          <div className={tw(`File h-full w-full flex flex-col`)}>
            <div
              className={tw(
                `flex-none flex items-center pb-1 w-full justify-between`
              )}
            >
              <div className={tw(`flex items-center pr-2 text-sm`)}>
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  className={tw(`text-gray-500 fill-current mr-1`)}
                >
                  <path d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
                </svg>
                {path}
              </div>
              <BlockPicker
                value={block}
                onChange={(newBlock) => {
                  onChange({ block: newBlock });
                }}
                options={relevantBlockOptions || []}
              />
            </div>
            {BlockComponent && block ? (
              <div className={tw(`w-full flex-1`)}>
                <div className={tw(`scaled-down`)}>
                  <BlockComponent
                    {...(blockProps || {})}
                    block={block}
                    path={path}
                    content={contents}
                    onRequestGitHubData={async (...args) => {
                      // catch API errors
                      try {
                        return await blockProps.onRequestGitHubData(...args);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <pre
                className={tw(
                  `text-xs pl-[1.7em] overflow-auto py-1 text-gray-500`
                )}
              >
                {contents}
              </pre>
            )}
          </div>
        ) : null}
      </div>

      {/* close button */}
      <button
        className={tw(
          `absolute top-1 right-1 text-gray-500 opacity-0 group-hover:opacity-100`
        )}
        onClick={onDelete}
      >
        <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
        </svg>
      </button>

      <ResizeButton
        onResize={(newDimensions: Position) => {
          onChange({ dimensions: newDimensions });
        }}
        dimensions={dimensions}
      />
    </Box>
  );
};
