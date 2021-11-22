import { FileBlockProps } from "@githubnext/utils";

export default function (props: FileBlockProps) {
    const { content } = props;

    return <div dangerouslySetInnerHTML={{ __html: content }} />
}
