import Svg, { Circle, G, Path, Rect } from "react-native-svg";

const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;

const Book = ({
  x,
  y,
  w,
  h,
  cover,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  cover: string;
}) => (
  <G>
    <Rect x={x} y={y} width={w} height={h} rx={3} fill={cover} />
    <Rect
      x={x + w * 0.5}
      y={y + 4}
      width={w * 0.5 - 4}
      height={h - 8}
      rx={1.5}
      fill="#FBF6EC"
    />
    <Rect x={x + 12} y={y + 4} width={4} height={h - 8} rx={2} fill="#F2D48A" />
  </G>
);

const LoginIllustration = ({ height = 210 }: { height?: number }) => (
  <Svg
    width="100%"
    height={height}
    viewBox="0 0 360 220"
    preserveAspectRatio="xMidYMax meet"
    accessibilityLabel="A study desk with books, an open notebook and a finished test sheet"
  >
    <Circle cx={292} cy={56} r={30} fill="#F2D48A" />
    <G fill="#FFFFFF">
      <Circle cx={252} cy={80} r={13} />
      <Circle cx={271} cy={72} r={18} />
      <Circle cx={292} cy={81} r={12} />
      <Rect x={240} y={80} width={64} height={13} rx={6.5} />
    </G>
    <Path d={sparkle(62, 54, 9)} fill="#E0A458" />
    <Path d={sparkle(112, 30, 6)} fill="#4F6F58" />
    <Path d={sparkle(196, 46, 7)} fill="#C8643A" />

    <Rect x={20} y={188} width={320} height={14} rx={7} fill="#B9794D" />
    <Rect x={36} y={202} width={288} height={8} rx={4} fill="#9C6440" />

    <Book x={46} y={166} w={92} h={22} cover="#4F6F58" />
    <Book x={56} y={144} w={78} h={22} cover="#C8643A" />
    <Book x={44} y={124} w={86} h={20} cover="#3F6577" />

    <Path d="M74 104 L102 104 L98 124 L78 124 Z" fill="#A4502C" />
    <Path d="M88 104 C80 92 70 88 62 90 C66 99 76 104 88 104 Z" fill="#6F9A78" />
    <Path d="M88 104 C92 88 102 80 112 80 C110 92 100 102 88 104 Z" fill="#4F6F58" />
    <Path d="M88 104 C86 92 88 82 94 74 C98 84 96 96 88 104 Z" fill="#88B092" />

    <Path
      d="M146 176 C170 172 190 174 200 182 C210 174 230 172 254 176 L254 185 C230 181 210 183 200 189 C190 183 170 181 146 185 Z"
      fill="#3F6577"
    />
    <Path
      d="M200 180 C185 172 165 172 150 176 L150 128 C165 124 185 124 200 132 Z"
      fill="#FBF6EC"
      stroke="#E3DACB"
      strokeWidth={1.5}
    />
    <Path
      d="M200 180 C215 172 235 172 250 176 L250 128 C235 124 215 124 200 132 Z"
      fill="#FFFFFF"
      stroke="#E3DACB"
      strokeWidth={1.5}
    />
    <G stroke="#D9CFBF" strokeWidth={2.5} strokeLinecap="round">
      <Path d="M160 142 L190 145" />
      <Path d="M160 152 L190 155" />
      <Path d="M160 162 L182 164" />
      <Path d="M210 145 L240 142" />
      <Path d="M210 155 L232 153" />
    </G>
    <Path
      d="M160 142 L190 145"
      stroke="#F2B27A"
      strokeWidth={5}
      strokeLinecap="round"
    />
    <Path
      d="M212 166 L218 171 L230 160"
      stroke="#4F6F58"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    <G rotation={8} origin="298, 146">
      <Rect
        x={266}
        y={104}
        width={64}
        height={82}
        rx={7}
        fill="#FFFFFF"
        stroke="#E3DACB"
        strokeWidth={1.5}
      />
      <Rect x={275} y={114} width={30} height={5} rx={2.5} fill="#2D2A24" />
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Circle
            cx={281}
            cy={134 + i * 15}
            r={5}
            fill={i === 2 ? "#F5E0D3" : "#E2EBDD"}
          />
          {i < 2 ? (
            <Path
              d={`M278.5 ${134 + i * 15} L280.5 ${136 + i * 15} L284 ${131.5 + i * 15}`}
              stroke="#4F6F58"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : (
            <Circle cx={281} cy={134 + i * 15} r={1.8} fill="#C8643A" />
          )}
          <Rect
            x={291}
            y={132 + i * 15}
            width={i === 1 ? 22 : 30}
            height={4}
            rx={2}
            fill="#E3DACB"
          />
        </G>
      ))}
    </G>

    <G rotation={-5} origin="250, 186">
      <Rect x={216} y={181} width={6} height={8} rx={1.5} fill="#E58A7A" />
      <Rect x={222} y={181} width={52} height={8} fill="#E9B949" />
      <Rect x={222} y={181} width={52} height={2.5} fill="#F2CC6B" />
      <Path d="M274 181 L285 185 L274 189 Z" fill="#F3DDB5" />
      <Path d="M281.5 183.7 L285 185 L281.5 186.3 Z" fill="#2D2A24" />
    </G>
  </Svg>
);

export default LoginIllustration;
