import Svg, { Circle, G, Path, Rect } from "react-native-svg";

export const DotField = ({ color = "#3B5245" }: { color?: string }) => {
  const dots = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 9; col++) {
      if (col + row < 5) continue;
      dots.push(
        <Circle
          key={`${row}-${col}`}
          cx={col * 12 + 4}
          cy={row * 12 + 4}
          r={2.2}
          fill={color}
        />,
      );
    }
  }
  return (
    <Svg width={104} height={80} viewBox="0 0 104 80">
      {dots}
    </Svg>
  );
};

export const TestsArt = () => (
  <Svg width={92} height={84} viewBox="0 0 92 84">
    <G rotation={-8} origin="46, 44">
      <Rect
        x={22}
        y={10}
        width={50}
        height={64}
        rx={6}
        fill="#FFFFFF"
        stroke="#E3DACB"
        strokeWidth={1.5}
      />
      <Rect x={30} y={19} width={24} height={5} rx={2.5} fill="#2D2A24" />
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Circle
            cx={35}
            cy={36 + i * 12}
            r={4.5}
            fill={i === 2 ? "#F5E0D3" : "#E2EBDD"}
          />
          {i < 2 ? (
            <Path
              d={`M32.8 ${36 + i * 12} L34.6 ${38 + i * 12} L37.6 ${34 + i * 12}`}
              stroke="#4F6F58"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : (
            <Circle cx={35} cy={60} r={1.6} fill="#C8643A" />
          )}
          <Rect
            x={44}
            y={34 + i * 12}
            width={i === 1 ? 16 : 22}
            height={4}
            rx={2}
            fill="#E3DACB"
          />
        </G>
      ))}
    </G>
    <Circle cx={74} cy={64} r={13} fill="#4F6F58" />
    <Path
      d="M68 64 L72.5 68.5 L80.5 59.5"
      stroke="#FFFFFF"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const CoursesArt = () => (
  <Svg width={96} height={84} viewBox="0 0 96 84">
    <Rect x={14} y={18} width={66} height={44} rx={8} fill="#3F6577" />
    <Rect x={19} y={23} width={56} height={34} rx={5} fill="#DDE8EC" />
    <Circle cx={47} cy={40} r={10} fill="#FFFFFF" />
    <Path d="M44 34.5 L52.5 40 L44 45.5 Z" fill="#3F6577" />
    <Rect x={38} y={62} width={18} height={6} fill="#2F4C59" />
    <Rect x={28} y={68} width={38} height={5} rx={2.5} fill="#2F4C59" />
    <G rotation={12} origin="78, 22">
      <Path d="M66 22 L78 16 L90 22 L78 28 Z" fill="#2D2A24" />
      <Path
        d="M71 24.5 L71 30 C75 33 81 33 85 30 L85 24.5 L78 28 Z"
        fill="#2D2A24"
      />
      <Path
        d="M88 23 L88 31"
        stroke="#E0A458"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={88} cy={32} r={1.8} fill="#E0A458" />
    </G>
  </Svg>
);

export const NotesStack = () => (
  <Svg width={70} height={40} viewBox="0 0 70 40">
    <Rect x={2} y={10} width={36} height={26} rx={4} fill="#C8643A" />
    <Rect x={14} y={6} width={36} height={26} rx={4} fill="#E0A458" />
    <Rect
      x={28}
      y={2}
      width={38}
      height={28}
      rx={4}
      fill="#FFFFFF"
      stroke="#E3DACB"
      strokeWidth={1.5}
    />
    <Rect x={34} y={9} width={20} height={3} rx={1.5} fill="#D9CFBF" />
    <Rect x={34} y={15} width={26} height={3} rx={1.5} fill="#D9CFBF" />
    <Rect x={34} y={21} width={16} height={3} rx={1.5} fill="#D9CFBF" />
  </Svg>
);

export const ProgressTrail = () => (
  <Svg width={124} height={60} viewBox="0 0 150 72">
    <Path
      d="M4 60 C26 60 30 34 52 38 C72 42 74 16 98 20 C118 23 124 8 146 6"
      stroke="#E0A458"
      strokeWidth={10}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M4 60 C26 60 30 34 52 38 C72 42 74 16 98 20 C118 23 124 8 146 6"
      stroke="#F4E8CC"
      strokeWidth={3}
      strokeLinecap="round"
      strokeDasharray="2 8"
      fill="none"
    />
  </Svg>
);

export const WalletArcs = () => (
  <Svg width={150} height={130} viewBox="0 0 150 130">
    <Circle
      cx={150}
      cy={0}
      r={120}
      stroke="#4E3A2D"
      strokeWidth={14}
      fill="none"
    />
    <Circle
      cx={150}
      cy={0}
      r={86}
      stroke="#5C4535"
      strokeWidth={14}
      fill="none"
    />
    <Circle cx={150} cy={0} r={52} fill="#6B5240" />
    <Circle cx={118} cy={34} r={9} fill="#E0C47F" />
  </Svg>
);
