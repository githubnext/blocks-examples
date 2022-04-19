import { useEffect, useState } from "react";
import { Dimensions, Position } from "./index";

export const useDrag = (
  ref: React.RefObject<HTMLElement>,
  dimensions: Dimensions,
  onDrag: (position: Position) => void
) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: MouseEvent) => {
    const startPosition = [e.clientX, e.clientY];
    const startDimensions = dimensions;
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (startPosition) {
        const deltaX = e.clientX - startPosition[0];
        const deltaY = e.clientY - startPosition[1];
        const newDimensions: Dimensions = [
          startDimensions[0] + deltaX,
          startDimensions[1] + deltaY,
        ];

        onDrag(newDimensions);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (ref?.current) {
      ref.current.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      if (ref?.current) {
        ref.current.removeEventListener("mousedown", handleMouseDown);
      }
    };
  }, [ref, dimensions]);

  return {
    isDragging,
  };
};
