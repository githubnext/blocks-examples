import { useMemo } from "react";
import { FileBlockProps } from "@githubnext/utils";
import DOMPurify from 'dompurify'

export default function (props: FileBlockProps) {
  const { content } = props;

  const sanitizedContent = useMemo(() => (
    DOMPurify.sanitize(content, { ALLOWED_TAGS: ["iframe"], ADD_ATTR: ['allow', 'allowfullscreen', 'mozallowfullscreen', 'webkitallowfullscreen', 'frameborder', 'scrolling', 'width', 'height'] })
  ), [content])

  return (
    <div style={{
      padding: "25px 20px"
    }}>
      <div style={{
        all: "initial",
      }}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  )
}
