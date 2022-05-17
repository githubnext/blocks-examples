import { tw } from "twind";
import { ActionList, ActionMenu } from "@primer/react";

import { useState } from "react";
import { Files, File } from "./index";

export const FilePicker = ({
  files,
  onFileSelected,
}: {
  files: Files;
  onFileSelected: (file: File) => void;
}) => {
  // needed to close the dropdown, which is an uncontrolled detail element
  const [iteration, setIteration] = useState(0);

  return (
    <ActionMenu>
      <ActionMenu.Button>+ File</ActionMenu.Button>

      <ActionMenu.Overlay>
        <ActionList>
          {files.map((file) => {
            return (
              <ActionList.Item
                onSelect={() => {
                  onFileSelected(file);
                  setIteration(iteration + 1);
                }}
                key={file.path}
                className={tw(`dropdown-item text-sm w-full`)}
              >
                {file.path}
              </ActionList.Item>
            );
          })}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
};
