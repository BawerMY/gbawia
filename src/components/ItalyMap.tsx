"use client";

import type { ReactNode } from "react";
import type { CapitalId, Mode } from "@/lib/types";
import { CAPITALS, capitalLabel, getCapital, routesForMode } from "@/lib/geo";
import { italyOutlinePath, MAP_WIDTH, MAP_HEIGHT, projectPoint } from "@/lib/mapProjection";
import type { VehicleView } from "@/lib/scenario";
import { useLanguage } from "@/lib/i18n";

const THRESHOLD = 0.8;

interface ItalyMapProps {
  mode?: Mode;
  highlight?: { from: CapitalId; to: CapitalId } | null;
  vehicles?: VehicleView[];
  stock?: { id: CapitalId; units: number; capacity: number }[];
  children?: ReactNode;
  className?: string;
}

export function ItalyMap({
  mode = "truck",
  highlight = null,
  vehicles = [],
  stock = [],
  children,
  className = "",
}: ItalyMapProps) {
  const { lang } = useLanguage();
  const routes = routesForMode(mode);
  const capitals = mode === "intermodal" ? CAPITALS : CAPITALS.filter((c) => !c.island);
  const stockByNode = new Map(stock.map((s) => [s.id, s]));

  const point = (id: CapitalId) => {
    const c = getCapital(id);
    return projectPoint(c.lon, c.lat);
  };

  const hlA = highlight ? point(highlight.from) : null;
  const hlB = highlight ? point(highlight.to) : null;

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className={`block ${className}`}
      role="img"
      aria-label={lang === "it" ? "Mappa dell'Italia" : "Map of Italy"}
    >
      <defs>
        <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece9dc" />
          <stop offset="1" stopColor="#e4e0cf" />
        </linearGradient>
      </defs>

      <path d={italyOutlinePath()} fill="url(#land)" stroke="#cfcdbf" strokeWidth="1" />

      {routes.map((r) => {
        const a = point(r.from);
        const b = point(r.to);
        return (
          <line
            key={`${r.from}-${r.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={r.carrier === "ship" ? "#2E7FD9" : "#7c7f72"}
            strokeWidth={3}
            strokeDasharray={r.carrier === "ship" ? "6 7" : undefined}
            opacity={r.carrier === "ship" ? 0.9 : 1}
          />
        );
      })}

      {hlA && hlB && (
        <line
          x1={hlA.x}
          y1={hlA.y}
          x2={hlB.x}
          y2={hlB.y}
          stroke="#12A02E"
          strokeWidth="4"
          strokeLinecap="round"
          className="route-flow"
        />
      )}

      {capitals.map((c) => {
        const p = projectPoint(c.lon, c.lat);
        const isHl =
          (highlight && highlight.from === c.id) || (highlight && highlight.to === c.id);
        const st = stockByNode.get(c.id);
        const hasStock = !!st && st.units > 0;
        const stockFill = hasStock && st!.capacity > 0 ? Math.min(1, st!.units / st!.capacity) : 0;
        const C = 2 * Math.PI * 21;
        return (
          <g key={c.id}>
            {hasStock && (
              <circle
                cx={p.x}
                cy={p.y}
                r="21"
                fill="none"
                stroke="#12A02E"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={`${stockFill * C} ${C}`}
                transform={`rotate(-90 ${p.x} ${p.y})`}
                opacity="0.9"
              />
            )}
            {isHl && (
              <circle cx={p.x} cy={p.y} r="26" fill="none" stroke="#12A02E" strokeWidth="3.5" className="pulse-ring" />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r="13"
              fill={isHl ? "#12A02E" : "#FDFDFB"}
              stroke={isHl ? "#029A3F" : "#1E201F"}
              strokeWidth="3.5"
            />
            <text
              x={p.x + 23}
              y={p.y - 16}
              fontSize="25"
              fill="#5b5f57"
              className="font-medium"
            >
              {capitalLabel(c.id, lang)}
            </text>
            {hasStock && (
              <text
                x={p.x}
                y={p.y + 44}
                textAnchor="middle"
                fontSize="21"
                fontWeight="700"
                fill="#029A3F"
              >
                {st!.units}u
              </text>
            )}
          </g>
        );
      })}

      {vehicles.map((v) => (
        <VehicleGlyph key={v.id} vehicle={v} />
      ))}

      {children}
    </svg>
  );
}

function VehicleGlyph({ vehicle }: { vehicle: VehicleView }) {
  const percent = Math.round(vehicle.fullness * 100);
  const atThreshold = vehicle.fullness >= THRESHOLD;
  const badgeColor = vehicle.phase === "moving" || atThreshold ? "#029A3F" : "#E0A33A";
  const Icon = vehicle.carrier === "ship" ? ShipShape : TruckShape;

  return (
    <g transform={`translate(${vehicle.x} ${vehicle.y})`}>
      <g transform="scale(1.6)">
        <Icon />
        <g transform="translate(0 -20)">
          <rect
            x="-20"
            y="-11"
            width="40"
            height="20"
            rx="10"
            fill={badgeColor}
            opacity="0.96"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
          >
            {percent}%
          </text>
        </g>
      </g>
    </g>
  );
}

function TruckShape() {
  return (
    <g transform="translate(-16 -12.8) scale(0.05)" fill="#1E201F">
      <path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16M160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48m320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48m80-208H416V144h44.1l99.9 99.9z" />
    </g>
  );
}

function ShipShape() {
  return (
    <g transform="translate(-13 -9)">
      <path d="M1 7 L7 0 L27 0 L33 7 Z" fill="#2E7FD9" />
      <path d="M1 7 L13 14 L33 7 L25 11 L13 15 L3 11 Z" fill="#1e5a9c" />
    </g>
  );
}