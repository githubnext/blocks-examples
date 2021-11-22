import { FileBlockProps } from '@githubnext/utils';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function (props: FileBlockProps) {
  const { content } = props;

  return (
    <ReactMarkdown children={content} remarkPlugins={[remarkGfm]} />
  );
}
