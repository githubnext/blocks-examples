import { useState } from "react";
import { Block } from "./index";

export const BlockPicker = ({
  value,
  onChange,
  options,
}: {
  value: Block;
  onChange: (newBlock: Block) => void;
  options: any[];
}) => {
  const [iteration, setIteration] = useState(0);
  return (
    <details
      className="dropdown details-reset details-overlay d-inline-block mr-2"
      key={iteration}
    >
      <summary className="btn" aria-haspopup="true">
        {value?.title || "Block"}
        <div className="dropdown-caret"></div>
      </summary>

      <ul className="dropdown-menu dropdown-menu-sw max-h-[calc(100vh-16em)] overflow-auto">
        {options.map((block) => {
          return (
            <li key={block.key} className="dropdown-item text-sm">
              <button
                onClick={() => {
                  onChange(block);
                  setIteration(iteration + 1);
                }}
                className="truncate w-full text-left"
              >
                {block.title}
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
};
