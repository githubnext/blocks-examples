import { FileBlockProps } from '@githubnext/utils';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Block(props: FileBlockProps) {
  const { content } = props;

  return (
    <ReactMarkdown children={content} remarkPlugins={[remarkGfm]} />
  );
}
