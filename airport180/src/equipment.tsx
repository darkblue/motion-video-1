import React from "react";
import { C, T, r, pop } from "./ui";
export const Equipment = ({
  f,
  x = 120,
  y = 260,
  scale = 1,
}: {
  f: number;
  x?: number;
  y?: number;
  scale?: number;
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {[
      "值机设备|Check-in",
      "航显屏幕|FIDS",
      "行李分拣|BHS",
      "安检设备|Security",
      "登机桥|Boarding Bridge",
    ].map((s, i) => (
      <g key={s} opacity={pop(f, i * 14)} transform={`translate(${i * 340} 0)`}>
        <rect width={280} height={195} rx={18} fill={C.panel} stroke={C.line} />
        {i === 0 ? (
          <>
            <path d="M85 145V42h108v103Z" fill="#4c788f" />
            <rect x={103} y={60} width={70} height={48} rx={5} fill={C.cyan} />
            <path d="M112 127h55" stroke={C.orange} strokeWidth={7} />
          </>
        ) : i === 1 ? (
          <>
            <rect
              x={35}
              y={38}
              width={210}
              height={113}
              rx={8}
              fill="#29516a"
            />
            {[0, 1, 2, 3].map((j) => (
              <path
                key={j}
                d={`M52 ${59 + j * 23}h100m15 0h58`}
                stroke={j === 2 ? C.orange : C.cyan}
                strokeWidth={7}
              />
            ))}
          </>
        ) : i === 2 ? (
          <>
            <path
              d="M35 137h210M140 137l75-82"
              stroke="#527b91"
              strokeWidth={30}
            />
            {[0, 1, 2].map((j) => (
              <rect
                key={j}
                x={45 + ((f + j * 50) % 160)}
                y={115}
                width={28}
                height={25}
                rx={3}
                fill={C.orange}
              />
            ))}
          </>
        ) : i === 3 ? (
          <>
            <path
              d="M75 140V35h140v105"
              stroke="#86adbf"
              strokeWidth={26}
              fill="none"
            />
            <path d="M35 149h210" stroke={C.cyan} strokeWidth={14} />
            <rect x={110} y={118} width={37} height={25} fill={C.orange} />
            <path
              d={`M${100 + (f % 65)} 50v80`}
              stroke={C.cyan}
              strokeWidth={3}
            />
          </>
        ) : (
          <>
            <path
              d="M35 70h95l55 60h60"
              stroke="#83a9b9"
              strokeWidth={35}
              fill="none"
            />
            <path
              d="M35 70h95l55 60h60"
              stroke={C.cyan}
              strokeWidth={4}
              fill="none"
            />
            <path d="M186 145v27m45-27v27" stroke={C.white} strokeWidth={6} />
          </>
        )}
        <T x={140} y={240} anchor="middle" size={28}>
          {s.split("|")[0]}
        </T>
        <T x={140} y={275} anchor="middle" size={21} fill={C.muted}>
          {s.split("|")[1]}
        </T>
      </g>
    ))}
  </g>
);
