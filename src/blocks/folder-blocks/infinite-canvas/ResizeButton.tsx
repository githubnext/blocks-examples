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
      className="position-absolute bottom-0 right-0 w-5 h-5 bg-gray-200 z-10"
      style={{
        cursor: "nwse-resize",
      }}
      ref={buttonElement}
    />
  );
};
