import { tw } from "twind";
import { ActionList, ActionMenu } from "@primer/react";
import { TreeNode } from "@githubnext/blocks";

export const FilePicker = ({
  files,
  onFileSelected,
}: {
  files: TreeNode[];
  onFileSelected: (path: string) => void;
}) => {
  return (
    <ActionMenu>
      <ActionMenu.Button>+ File</ActionMenu.Button>

      <ActionMenu.Overlay>
        <ActionList
          variant="full"
          className={tw(`max-h-[300px] p-1 overflow-y-auto`)}
        >
          {files.map((file) => {
            return (
              <ActionList.Item
                onSelect={() => {
                  onFileSelected(file.meta.path);
                }}
                key={file.path}
                className={tw(`text-sm w-full`)}
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
