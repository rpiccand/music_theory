interface StickyNoteProps {
  onClick: () => void;
}

export default function StickyNote({ onClick }: StickyNoteProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retirer le post-it"
      className="absolute"
      style={{
        top: -6,
        right: -6,
        bottom: -6,
        left: -6,
        zIndex: 30,
        background: 'linear-gradient(180deg, #fff59d 0%, #ffeb3b 60%, #fdd835 100%)',
        boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
        transform: 'rotate(-2.5deg)',
        border: '1px solid rgba(0,0,0,0.15)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 6,
        left: '50%',
        transform: 'translateX(-50%) rotate(2.5deg)',
        width: 46,
        height: 10,
        background: 'rgba(0,0,0,0.15)',
        borderRadius: 2
      }} />
    </button>
  );
}