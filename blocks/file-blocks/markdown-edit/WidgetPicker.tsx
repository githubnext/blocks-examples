import { Block } from "@githubnext/blocks";
import { ActionList, ActionMenu, Box, Text } from "@primer/react";
import {
  InfoIcon,
  LinkExternalIcon,
  RepoIcon,
  VerifiedIcon,
} from "@primer/octicons-react";
import { tw } from "twind";

const WidgetPicker = ({
  location,
  isLoading,
  blocks,
  focusedBlockIndex,
  onClose,
  onSelect,
  onFocus,
}: {
  location?: DOMRect;
  isLoading: boolean;
  blocks: Block[];
  focusedBlockIndex: number;
  onClose: () => void;
  onFocus: (index: number) => void;
  onSelect: (index: number) => void;
}) => {
  return (
    <div className={tw("")}>
      <ActionMenu open={true} onChange={onClose}>
        <ActionMenu.Button className={tw("hidden !h-0")}>
          Open Actions Menu
        </ActionMenu.Button>
        <ActionMenu.Overlay
          top={(location?.top || 0) + 56}
          left={(location?.left || 0) - 10}
          width="large"
          sx={{ px: 2 }}
          onEscape={onClose}
          className={tw("max-h-[20em] overflow-auto")}
          onClickOutside={onClose}
        >
          {isLoading ? (
            <div className={tw("text-center w-full p-6 italic")}>
              <Text color="fg.subtle">Loading...</Text>
            </div>
          ) : !blocks.length ? (
            <div className={tw("text-center w-full p-6 italic")}>
              <Text color="fg.subtle">No Blocks found</Text>
            </div>
          ) : (
            <ActionList selectionVariant="single">
              <ActionList.Group title="Blocks" selectionVariant="single">
                {blocks.map((block, index) => {
                  const isExampleBlock =
                    [block.owner, block.repo].join("/") ===
                    `githubnext/blocks-examples`;
                  return (
                    // <div> because <button> steals the focus, even with tabIndex="-1" & preventFocusOnOpen
                    <div
                      className={tw(
                        "group w-full text-left bg-white px-4 py-2 cursor-pointer hover:bg-gray-100 focus:outline-none",
                        focusedBlockIndex === index
                          ? "bg-gray-100 rounded-md"
                          : "bg-transparent"
                      )}
                      onMouseEnter={() => onFocus(index)}
                      onClick={() => onSelect(index)}
                      key={[block.owner, block.repo, block.id].join("__")}
                    >
                      <div className={tw("flex justify-between text-sm")}>
                        <div className={tw("font-semibold")}>{block.title}</div>
                        {/* <div> because <a> steals the focus, even with tabIndex="-1" & preventFocusOnOpen */}
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            const url = `https://github.com/${block.owner}/${block.repo}`;
                            window.top?.open(url, "_blank");
                          }}
                          className={tw(
                            "text-xs mt-[2px] opacity-0 focus:opacity-100 group-hover:opacity-100"
                          )}
                          color="fg.muted"
                        >
                          <Text
                            className={tw("flex items-center")}
                            color="fg.muted"
                          >
                            View code
                            <LinkExternalIcon
                              className={tw("ml-1 opacity-50")}
                            />
                          </Text>
                        </div>
                      </div>

                      <Box className={tw("text-xs")} color="fg.muted">
                        <Box className={tw("flex items-center mt-1")}>
                          <Text className={tw("mr-1")} color="fg.muted">
                            <RepoIcon />
                          </Text>
                          <Text color="fg.muted" pb="1">
                            {block.owner}/{block.repo}
                            {isExampleBlock && (
                              <Text ml={1} color="ansi.blue">
                                <VerifiedIcon />
                              </Text>
                            )}
                          </Text>
                        </Box>
                        <div className={tw("flex items-start mt-1")}>
                          <div className={tw("mr-1")}>
                            <InfoIcon />
                          </div>
                          {block.description}
                        </div>
                      </Box>
                    </div>
                  );
                })}
              </ActionList.Group>
            </ActionList>
          )}
        </ActionMenu.Overlay>
      </ActionMenu>
    </div>
  );
};

export default WidgetPicker;
