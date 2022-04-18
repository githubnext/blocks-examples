import { IThemedToken } from "shiki";

interface LineProps {
  onSelect: (line: number, shift: boolean) => void;
  token: IThemedToken[];
  number: number;
  isHighlighted: boolean;
  hasLineMenu: boolean;
}

export function Line(props: LineProps) {
  const { hasLineMenu, onSelect, token, number, isHighlighted } = props;

  return (
    <div className="flex">
      <div
        onClick={(e) => {
          if (!hasLineMenu) {
            onSelect(number, e.shiftKey);
          }
        }}
        role="button"
        className="td-line-num font-mono relative hover:opacity-60"
        data-line-number={number}
      ></div>
      <div className={`px-2 flex-1 ${isHighlighted ? "highlighted" : ""}`}>
        <pre className="text-[12px]">
          {token.map((t, i) => (
            <span key={`${number}-token-${i}`} style={{ color: t.color }}>
              {t.content}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
