import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Text as SvgText, TSpan } from "react-native-svg";

export type SpinWheelSegment = { key: string | number; label: string; color: string };

type Props = {
  segments: SpinWheelSegment[];
  /** Rendered width in px; the height follows the 200 x 210 view box. */
  size: number;
  /** Degrees the slices are turned by; the pointer and rim stay put. */
  rotation: number;
  /** How long a change of rotation animates for; 0 jumps straight there. */
  spinMs: number;
  /** Rendered over the hub, e.g. the Spin button. */
  center?: React.ReactNode;
};

/* Same curve as the web wheel: a quick start held at an even pace, then a long, gradual slowdown. */
const SPIN_EASING = Easing.bezier(0.25, 0.3, 0.35, 1);

const DARK_INK = "#33164F";
const LIGHT_INK = "#FFFFFF";
const VIEW = 200;
const CX = VIEW / 2;
const CY = CX + 10;
const RADIUS = 92;

const GOLD = "#E9B957";
const GOLD_DARK = "#B8862F";
const CREAM = "#FFF9F1";
const YELLOW = "#FFF0BE";
const DEEP = "#49216B";
/* Touch targets outside a parent's bounds get no taps on Android, so the hub sits in a real box. */
const HUB_BOX = 88;

/* Picks the label ink by relative luminance, so an admin-chosen dark slice still reads. */
function inkFor(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return DARK_INK;
  const value = parseInt(match[1], 16);
  const channel = (shift: number) => {
    const c = ((value >> shift) & 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
  return luminance > 0.36 ? DARK_INK : LIGHT_INK;
}

const point = (cy: number, r: number, angle: number) => ({
  x: CX + r * Math.cos(angle),
  y: cy + r * Math.sin(angle),
});

/**
 * The rotation that brings slice `index` under the pointer, at least `turns` full turns past
 * `from`, landing a little off-centre (within the middle 60% of the slice) so it looks natural.
 * Same maths as the web wheel's rotationForSlice.
 */
export function rotationForSlice(
  index: number,
  count: number,
  from: number,
  turns = 6,
  jitter = Math.random() - 0.5,
): number {
  const slice = 360 / Math.max(count, 1);
  const target = (((-index * slice) % 360) + 360) % 360;
  const current = ((from % 360) + 360) % 360;
  const delta = (target - current + 360) % 360;
  return from + turns * 360 + delta + jitter * slice * 0.6;
}

/* Equal slices in reward order. Slice size says nothing about odds. */
export default function SpinWinWheel({ segments, size, rotation, spinMs, center }: Props) {
  const scale = size / VIEW;
  const height = (VIEW + 10) * scale;
  const angle = useSharedValue(rotation);

  useEffect(() => {
    angle.value =
      spinMs > 0 ? withTiming(rotation, { duration: spinMs, easing: SPIN_EASING }) : rotation;
  }, [rotation, spinMs, angle]);

  const rotorStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  const count = segments.length;
  const slice = count > 0 ? (2 * Math.PI) / count : 0;
  const start = -Math.PI / 2 - slice / 2;
  const labelSize = count > 8 ? 6.5 : count > 6 ? 7.5 : 8.5;
  // The rotor layer is a square centred on the hub, so it turns about the hub.
  const RC = VIEW / 2;

  return (
    <View style={{ width: size, height }}>
      <Svg width={size} height={height} viewBox={`0 0 ${VIEW} ${VIEW + 10}`}>
        <Circle cx={CX} cy={CY} r={RADIUS + 6} fill={GOLD} stroke={YELLOW} strokeWidth={1.2} />
      </Svg>

      <Animated.View
        style={[
          { position: "absolute", left: 0, top: 10 * scale, width: size, height: size },
          rotorStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
          {count === 0 ? (
            <Circle cx={RC} cy={RC} r={RADIUS} fill="#E5E7EB" />
          ) : count === 1 ? (
            <Circle cx={RC} cy={RC} r={RADIUS} fill={segments[0].color} stroke={CREAM} strokeWidth={1.4} />
          ) : (
            segments.map((segment, i) => {
              const a0 = start + i * slice;
              const p0 = point(RC, RADIUS, a0);
              const p1 = point(RC, RADIUS, a0 + slice);
              const large = slice > Math.PI ? 1 : 0;
              return (
                <Path
                  key={segment.key}
                  d={`M ${RC} ${RC} L ${p0.x} ${p0.y} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${p1.x} ${p1.y} Z`}
                  fill={segment.color}
                  stroke={CREAM}
                  strokeWidth={1.4}
                />
              );
            })
          )}
          {segments.map((segment, i) => {
            const mid = start + (i + 0.5) * slice;
            const at = point(RC, RADIUS * 0.6, count === 1 ? -Math.PI / 2 : mid);
            // Radial labels, flipped on the left half so none reads upside down at rest.
            const degrees = (((((mid * 180) / Math.PI) % 360) + 540) % 360) - 180;
            const rotate = count === 1 ? 0 : Math.abs(degrees) > 90 ? degrees + 180 : degrees;
            // A "\n" in a label stacks it: a small first line over the main one.
            const lines = segment.label
              .split("\n")
              .map((line) => (line.length > 14 ? `${line.slice(0, 13)}…` : line));
            const ink = inkFor(segment.color);
            return (
              <G key={`label-${segment.key}`} transform={`rotate(${rotate} ${at.x} ${at.y})`}>
                {lines.length === 1 ? (
                  <SvgText
                    x={at.x}
                    y={at.y + labelSize * 0.35}
                    fill={ink}
                    fontSize={labelSize}
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {lines[0]}
                  </SvgText>
                ) : (
                  <SvgText x={at.x} y={at.y} fill={ink} fontWeight="800" textAnchor="middle">
                    {lines.map((line, n) => (
                      <TSpan
                        key={n}
                        x={at.x}
                        dy={n === 0 ? -0.55 * (lines.length - 1) * labelSize + labelSize * 0.35 : 1.1 * labelSize}
                        fontSize={n === 0 ? labelSize * 0.78 : labelSize}
                      >
                        {line}
                      </TSpan>
                    ))}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </Animated.View>

      <Svg
        width={size}
        height={height}
        viewBox={`0 0 ${VIEW} ${VIEW + 10}`}
        style={{ position: "absolute", left: 0, top: 0 }}
        pointerEvents="none"
      >
        <Circle cx={CX} cy={CY} r={RADIUS + 0.8} fill="none" stroke={GOLD_DARK} strokeWidth={1.2} />
        {Array.from({ length: 16 }, (_, i) => {
          const bulb = point(CY, RADIUS + 3, (i / 16) * 2 * Math.PI);
          return (
            <Circle
              key={`bulb-${i}`}
              cx={bulb.x}
              cy={bulb.y}
              r={1.6}
              fill={CREAM}
              stroke={GOLD_DARK}
              strokeWidth={0.5}
            />
          );
        })}
        <Path
          d={`M ${CX} 27 C ${CX - 2.5} 21 ${CX - 7.5} 15 ${CX - 7.5} 9.5 A 7.5 7.5 0 0 1 ${CX + 7.5} 9.5 C ${CX + 7.5} 15 ${CX + 2.5} 21 ${CX} 27 Z`}
          fill={GOLD}
          stroke={CREAM}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Circle cx={CX} cy={9.5} r={2.8} fill={DEEP} stroke={CREAM} strokeWidth={0.8} />
      </Svg>

      {center ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 0,
            width: size,
            top: CY * scale - HUB_BOX / 2,
            height: HUB_BOX,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {center}
        </View>
      ) : null}
    </View>
  );
}
