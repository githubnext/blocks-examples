import {
  Block,
  BlockPicker,
  BlocksRepo,
  FileBlockProps,
} from "@githubnext/blocks";
import { Box } from "@primer/react";
import { useEffect, useState } from "react";

export default function (props: FileBlockProps) {
  const { metadata, BlockComponent, context, onRequestBlocksRepos } = props;

  const [panes, setPanes] = useState<Block[]>(metadata?.panes || []);

  const setDefaultBlockOptions = async () => {
    const blockRepoOptions = await onRequestBlocksRepos(context.path);
    const blockOptions = blockRepoOptions.reduce(
      (acc: Block[], repo: BlocksRepo) => {
        return [...acc, ...repo.blocks];
      },
      []
    );
    setPanes(blockOptions.slice(0, 2));
  };
  useEffect(() => {
    // default to first two relevant Blocks
    if (panes.length) return;
    setDefaultBlockOptions();
  }, [context.path]);

  return (
    <Box
      display="grid"
      gridTemplateColumns={`repeat(${panes.length}, 1fr)`}
      gridGap={2}
      height="100%"
      width="100%"
      overflow="hidden"
      p={2}
      relative
    >
      {panes.map((pane, index) => (
        <Box
          display="flex"
          flex="1"
          flexDirection="column"
          borderColor="border.default"
          borderWidth={1}
          borderStyle="solid"
          overflow="hidden"
          key={index}
        >
          <Box
            flex="none"
            p={1}
            backgroundColor="pageHeaderBg"
            borderColor="border.default"
            borderBottomWidth={1}
            borderBottomStyle="solid"
          >
            <BlockPicker
              value={pane}
              onChange={(pane) => {
                let newPanes = [...panes];
                newPanes[index] = pane;
                setPanes(newPanes);
              }}
              onRequestBlocksRepos={onRequestBlocksRepos}
            />
          </Box>
          <Box flex="1" overflow="auto">
            {BlockComponent ? (
              <BlockComponent context={context} block={pane} />
            ) : (
              <Box p={4} color="fg.subtle" fontStyle="italic">
                No BlockComponent
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
