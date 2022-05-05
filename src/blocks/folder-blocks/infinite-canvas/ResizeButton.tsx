import { tw } from "twind";
import { useRef } from "react";
import { useDrag } from "./useDrag";
import { Position } from "./index";

export const ResizeButton = ({
  onResize,
  dimensions,
}: {
  onResize: (newSize: Position) => void;
  dimensions: Position;
}) => {
  const buttonElement = useRef<HTMLButtonElement | null>(null);

  useDrag(buttonElement, dimensions, (newDimensions) => {
    onResize(newDimensions);
  });

  return (
    <button
      className={tw(`absolute bottom-0 right-0 w-4 h-4 z-10`)}
      style={{
        cursor: "nwse-resize",
      }}
      ref={buttonElement}
    >
      <svg
        className={tw("w-full h-full text-gray-300")}
        viewBox="0 0 10 10"
        stroke="currentColor"
      >
        <path d="M 0 10 L 10 0" vectorEffect="non-scaling-stroke" />
        <path d="M 3 10 L 10 3" vectorEffect="non-scaling-stroke" />
        <path d="M 6 10 L 10 6" vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
};
