import { KebabHorizontalIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu, IconButton } from "@primer/react";

export function LineMenu(props: {
  onExplain: () => void;
  start: number;
  end: number;
  onCopy: () => void;
  onCopyPermalink: () => void;
}) {
  const { onExplain, onCopy, start, end, onCopyPermalink } = props;
  const lineNoun = start === end ? "line" : "lines";

  return (
    <ActionMenu>
      <ActionMenu.Anchor>
        <IconButton
          size="small"
          sx={{ height: 25 }}
          icon={KebabHorizontalIcon}
          aria-label="Open column options"
        />
      </ActionMenu.Anchor>

      <ActionMenu.Overlay>
        <ActionList>
          <ActionList.Item onSelect={onCopy}>Copy {lineNoun}</ActionList.Item>
          <ActionList.Item onSelect={onCopyPermalink}>
            Copy Permalink
          </ActionList.Item>
          <ActionList.Divider />
          <ActionList.Item onSelect={onExplain}>Explain Code</ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
