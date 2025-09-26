import { useEffect } from 'react';

interface UseKeyboardControlsProps {
  goRight: () => void;
  goLeft: () => void;
  viewNext: () => void;
  viewPrev: () => void;
  dependencies: unknown[];
}

export function useKeyboardControls({
  goRight,
  goLeft,
  viewNext,
  viewPrev,
  dependencies
}: UseKeyboardControlsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goRight();
      } else if (e.key === "ArrowLeft") {
        goLeft();
      } else if (e.key === "ArrowUp") {
        viewNext();
      } else if (e.key === "ArrowDown") {
        viewPrev();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, dependencies);
}