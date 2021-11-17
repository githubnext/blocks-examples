import { FileBlockProps } from "@githubnext/utils";

export function Block(props: FileBlockProps) {
    const { content } = props;

    return <div dangerouslySetInnerHTML={{ __html: content }} />
}
