import { FileViewerProps } from "@githubnext/utils";

export function Viewer(props: FileViewerProps) {
    const { content } = props;

    return <div dangerouslySetInnerHTML={{ __html: content }} />
}
