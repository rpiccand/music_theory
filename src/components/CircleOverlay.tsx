import { createPortal } from "react-dom";
import CircleOfFifths from "./CircleOfFifths";

interface CircleOverlayProps {
  pc: number;
  onSelect: (pc: number) => void;
  size?: number;
  top?: number;
}

export default function CircleOverlay({
  pc,
  onSelect,
  size = 260,
  top = 16
}: CircleOverlayProps) {
  const node = (
    <div
      style={{
        position: 'fixed',
        top,
        left: '100vw',
        transform: 'translateX(-100%)',
        zIndex: 50,
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '9999px',
        padding: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
      }}
    >
      <CircleOfFifths pc={pc} size={size} onSelect={onSelect} />
    </div>
  );

  return createPortal(node, document.body);
}