import { FileViewerProps } from '@githubnext/utils';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Viewer(props: FileViewerProps) {
  const { content } = props;

  return (
    <ReactMarkdown children={content} remarkPlugins={[remarkGfm]} />
  );
}
