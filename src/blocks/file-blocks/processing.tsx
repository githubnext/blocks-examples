import { createRef, useEffect } from "react";
import { FileBlockProps } from "@githubnext/utils";
import p5 from "p5";

export default function (props: FileBlockProps) {
  const { content } = props;

  const p5Ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (p5Ref.current) {
      new p5(eval(content), p5Ref.current);
    }
  }, [p5Ref.current]);

  return <div ref={p5Ref}></div>;
}
