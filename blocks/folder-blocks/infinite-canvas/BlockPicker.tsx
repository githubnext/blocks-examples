import { tw } from "twind";
import { ActionList, ActionMenu } from "@primer/react";
import { useState } from "react";
import { BlockWithKey as Block } from "./index";

export const BlockPicker = ({
  value,
  onChange,
  options,
}: {
  value: Block;
  onChange: (newBlock: Block) => void;
  options: Block[];
}) => {
  // needed to close the dropdown, which is an uncontrolled detail element
  const [iteration, setIteration] = useState(0);

  return (
    <ActionMenu>
      <ActionMenu.Button>{value?.title || "Block"}</ActionMenu.Button>

      <ActionMenu.Overlay>
        <ActionList>
          {options.map((block) => {
            return (
              <ActionList.Item
                onSelect={() => {
                  onChange(block);
                  setIteration(iteration + 1);
                }}
                key={block.key}
                className={tw(`dropdown-item text-sm`)}
              >
                {block.title}
              </ActionList.Item>
            );
          })}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
};
