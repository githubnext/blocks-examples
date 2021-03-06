import { createRef, useEffect } from "react";
import { FileBlockProps } from "@githubnext/blocks";
import p5 from "p5";

export default function (props: FileBlockProps) {
  const { content } = props;

  const p5Ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (p5Ref.current) {
      // clear wrapper
      p5Ref.current.innerHTML = "";
      window.eval(content);
      try {
        new p5(undefined as any, p5Ref.current);
      } catch (e) {
        console.log(e);
      }
    }
  }, [p5Ref.current, content]);

  return <div ref={p5Ref} />;
}
