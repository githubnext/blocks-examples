import { createRef, useEffect } from "react";
import { FileBlockProps } from "@githubnext/utils";
import p5 from "p5";

export default function (props: FileBlockProps) {
  const { content } = props;

  const p5Ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (p5Ref.current) {
      try {
        new p5(eval(content), p5Ref.current);
      } catch (e) {
        // console.log(e);
      }
    }
  }, [p5Ref.current, content]);

  return <div ref={p5Ref}></div>;
}
