import React from "react";
import {useCurrentFrame, interpolate} from "remotion";
import contracts from "./data/contracts.json";
const cyan = "#4fe2d0",
  orange = "#ffb967",
  white = "#edf6ff",
  muted = "#a4bdce",
  panel = "#0d2c46";
export const clamp = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};
const r = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const T = ({
  x,
  y,
  children,
  size = 28,
  fill = white,
  anchor = "start",
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
}) => (
  <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor}>
    {children}
  </text>
);
const Card = ({
  x,
  y,
  w = 400,
  h = 110,
  cn,
  en,
  active = true,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  cn: string;
  en: string;
  active?: boolean;
}) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={18}
      fill={panel}
      stroke={active ? cyan : "#385368"}
      strokeWidth={active ? 2 : 1}
    />
    <T x={x + 24} y={y + 45} size={30}>
      {cn}
    </T>
    <T x={x + 24} y={y + 80} size={21} fill={muted}>
      {en}
    </T>
  </g>
);
const File = ({
  x,
  y,
  label,
  color = cyan,
}: {
  x: number;
  y: number;
  label: string;
  color?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-20 -28h29l13 13v44h-42Z" fill={color} />
    <path
      d="M9-28v14h13M-12-4h25M-12 5h25M-12 14h18"
      stroke="#082137"
      strokeWidth={2}
      fill="none"
    />
    <T x={0} y={52} anchor="middle" size={18} fill={color}>
      {label}
    </T>
  </g>
);
export function Contracts({ frame }: { frame?: number } = {}) {
  const current = useCurrentFrame();
  const f = frame ?? current;
  const review = f >= 240;
  const reviewAge = Math.max(0, f - 240);
  const cn = Object.fromEntries(contracts.actors.map((a) => [a.id, a.role]));
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <Card x={760} y={190} cn={cn.owner} en="Employer" />
      {[
        {
          id: "designer",
          x: 100,
          en: "Design Consultant",
          label: "设计咨询合同",
        },
        {
          id: "engineer",
          x: 750,
          en: "Engineer / Supervision",
          label: "工程师服务合同",
        },
        {
          id: "contractor",
          x: 1400,
          en: "Construction Contractor",
          label: "施工总承包合同",
        },
      ].map((n, i) => {
        const p = r(f, 16 + i * 42, 63 + i * 42);
        return (
          <g key={n.id}>
            <path
              data-relation="contract"
              data-from="owner"
              data-to={n.id}
              d={`M960 300V365H${n.x + 200}V450`}
              fill="none"
              stroke={orange}
              strokeWidth={4}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
            />
            <g opacity={p}>
              <T x={n.x + 200} y={416} size={24} anchor="middle" fill={orange}>
                {n.label}
              </T>
            </g>
            <Card x={n.x} y={450} cn={cn[n.id]} en={n.en} />
            {p > 0 && p < 1 && (
              <File
                x={960 + (n.x + 200 - 960) * p}
                y={300 + 150 * p}
                label="合同"
                color={orange}
              />
            )}
          </g>
        );
      })}
      <g opacity={r(f, 170, 210)}>
        <Card
          x={1400}
          y={710}
          h={95}
          cn={cn.supplier}
          en="Equipment Supplier"
        />
        <path
          data-relation="purchase_or_subcontract"
          data-from="contractor"
          data-to="supplier"
          d="M1600 560V710"
          stroke={orange}
          strokeWidth={4}
          fill="none"
        />
        <T x={1565} y={650} anchor="end" size={22} fill={orange}>
          采购／分包合同
        </T>
      </g>
      <g opacity={r(f, 210, 238)}>
        <rect x={100} y={670} width={980} height={130} rx={16} fill="#13354c" />
        <T x={128} y={715} size={27}>
          分别签约，各负其责
        </T>
        <T x={128} y={758} size={24} fill={muted}>
          工程师依合同授权监督工程与审查文件
        </T>
      </g>
      {review && (
        <g opacity={r(reviewAge, 0, 15)}>
          <path
            data-relation="submission"
            data-from="contractor"
            data-to="engineer"
            d="M1400 485C1310 425 1240 425 1150 485"
            stroke={cyan}
            strokeWidth={4}
            fill="none"
            strokeDasharray="12 9"
          />
          <path
            data-relation="review_response"
            data-from="engineer"
            data-to="contractor"
            d="M1150 535C1240 595 1310 595 1400 535"
            stroke="#9bafff"
            strokeWidth={4}
            fill="none"
            strokeDasharray="12 9"
          />
          <polygon points="1150,485 1170,478 1165,496" fill={cyan} />
          <polygon points="1400,535 1380,529 1385,546" fill="#9bafff" />
          <T x={1275} y={423} size={21} anchor="middle" fill={cyan}>
            图纸／材料报审
          </T>
          <T x={1275} y={618} size={21} anchor="middle" fill="#9bafff">
            审查意见／修订
          </T>
          <File
            x={1400 - 250 * ease((reviewAge % 85) / 85)}
            y={455}
            label="提交"
          />
          <File
            x={1150 + 250 * ease(((reviewAge + 40) % 105) / 105)}
            y={575}
            label="反馈"
            color="#9bafff"
          />
        </g>
      )}
      <g transform="translate(1370 250)">
        <path d="M0 0h64" stroke={orange} strokeWidth={4} />
        <T x={78} y={8} size={22} fill={orange}>
          合同关系
        </T>
        <path
          d="M250 0h64"
          stroke={cyan}
          strokeWidth={4}
          strokeDasharray="10 7"
        />
        <T x={328} y={8} size={22} fill={cyan}>
          文件往来
        </T>
      </g>
    </svg>
  );
}
