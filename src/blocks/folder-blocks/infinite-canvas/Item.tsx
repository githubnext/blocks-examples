import { useMemo, useRef, useState } from "react";
import { useDrag } from "./useDrag";
import { BlockPicker } from "./BlockPicker";
import { ResizeButton } from "./ResizeButton";
import { roundToInterval, Position, ItemType, Dimensions } from "./index";

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
  onDrag,
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
      if (block.type !== "file") return false;
      if (!block.extensions) return true;
      if (block.extensions?.includes("*")) return true;
      if (block.extensions?.includes(extension)) return true;
      return false;
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
    <div
      className={`item group Box shadow ${zIndex}`}
      style={{
        width: dimensions[0],
        height: dimensions[1],
        transform: `translate(${position[0]}px, ${position[1]}px)`,
      }}
    >
      {/* grabby header */}
      <div
        className={`${headerColor} h-full w-full flex-none`}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
        ref={headerElement}
      />

      <div className="px-3 py-2 w-full overflow-auto">
        {type === "text" ? (
          <div
            className="Text focus:outline-none cursor-text w-full h-full text-sm"
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
          <div className="File h-full w-full flex flex-col">
            <div className="flex-none flex items-center pb-1 w-full justify-between">
              <div className="flex items-center pr-2 text-sm">
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  className="text-gray-500 fill-current mr-1"
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
              <div className="w-full flex-1">
                <div className="scaled-down">
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
              <pre className="text-xs pl-[1.7em] overflow-auto py-1 text-gray-500">
                {contents}
              </pre>
            )}
          </div>
        ) : null}
      </div>

      {/* close button */}
      <button
        className="position-absolute top-1 right-1 text-gray-500 opacity-0 group-hover:opacity-100"
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
    </div>
  );
};
