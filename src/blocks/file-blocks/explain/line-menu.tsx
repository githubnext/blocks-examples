import { KebabHorizontalIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu, IconButton } from "@primer/react";

export function LineMenu(props: { onExplain: () => void }) {
  const { onExplain } = props;
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
          <ActionList.Item disabled>Copy Line</ActionList.Item>
          <ActionList.Item disabled>Copy Permalink</ActionList.Item>
          <ActionList.Item disabled>View git blame</ActionList.Item>
          <ActionList.Divider />
          <ActionList.Item onSelect={onExplain}>Explain Code</ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
