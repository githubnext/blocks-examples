import { FileBlockProps } from '@githubnext/utils';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import './markdown.css';

export default function (props: FileBlockProps) {
  const { content } = props;

  return (
    <ReactMarkdown className="markdown-body" children={content} remarkPlugins={[remarkGfm]} />
  );
}
