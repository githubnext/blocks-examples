import { useEffect, useMemo, useState } from "react";
import { FileBlockProps } from "@githubnext/utils";
import DOMPurify from "dompurify";

type LoadingStatus = "ready" | "error" | "idle";

export default function (props: FileBlockProps) {
  const { content } = props;

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(content),
    [content]
  );

  // load the p5.js library
  // this is copied from the way we use to load tailwindcss
  const src = "https://cdn.jsdelivr.net/npm/p5@1.4.1/lib/p5.js";

  const [status, setStatus] = useState<LoadingStatus>("idle");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-status", "loading");
    document.body.appendChild(script);
    const setAttributeFromEvent = (event: any) => {
      script.setAttribute(
        "data-status",
        event.type === "load" ? "ready" : "error"
      );
    };
    script.addEventListener("load", setAttributeFromEvent);
    script.addEventListener("error", setAttributeFromEvent);
    const setStateFromEvent = (event: any) => {
      setStatus(event.type === "load" ? "ready" : "error");
    };
    script.addEventListener("load", setStateFromEvent);
    script.addEventListener("error", setStateFromEvent);
    return () => {
      if (script) {
        script.removeEventListener("load", setStateFromEvent);
        script.removeEventListener("error", setStateFromEvent);
      }
    };
  }, []);

  // load the p5.js sketch from the content of a user's file
  useEffect(() => {
    const script = document.createElement("script");
    script.innerText = sanitizedContent;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      style={{
        padding: "25px 20px",
      }}
    >
      <div id="processing"></div>
    </div>
  );
}
