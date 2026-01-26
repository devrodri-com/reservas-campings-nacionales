"use client";

import React from "react";
import { parseYmd, toYmd, isYmd } from "@/lib/dates";

type Props = {
  label?: string;
  checkInDate: string;
  checkOutDate: string;
  onChange: (next: { checkInDate: string; checkOutDate: string }) => void;
  disabled?: boolean;
  hasError?: boolean;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, m: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + m, 1);
}
function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function clampDate(d: Date): Date {
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}
function isBetween(day: Date, start: Date, end: Date): boolean {
  const t = day.getTime();
  return t > start.getTime() && t < end.getTime();
}

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

export default function DateRangePicker(props: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const [tempStart, setTempStart] = React.useState<string>(props.checkInDate);
  const [tempEnd, setTempEnd] = React.useState<string>(props.checkOutDate);

  // mes visible: basado en check-in, si no es válido, hoy
  const initialMonth = React.useMemo(() => {
    const d = clampDate(parseYmd(props.checkInDate));
    return startOfMonth(d);
  }, [props.checkInDate]);

  const [month, setMonth] = React.useState<Date>(initialMonth);

  React.useEffect(() => {
    // sincronizar cuando cambia desde afuera
    setTempStart(props.checkInDate);
    setTempEnd(props.checkOutDate);
  }, [props.checkInDate, props.checkOutDate]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const border = props.hasError
    ? "1px solid rgba(239,68,68,0.8)"
    : "1px solid var(--color-border)";

  const startDateObj = isYmd(tempStart) ? clampDate(parseYmd(tempStart)) : new Date(NaN);
  const endDateObj = isYmd(tempEnd) ? clampDate(parseYmd(tempEnd)) : new Date(NaN);

  const monthStart = startOfMonth(month);
  const totalDays = daysInMonth(monthStart);

  // offset lunes=0 ... domingo=6
  const firstDay = new Date(monthStart);
  const jsDay = firstDay.getDay(); // 0=dom..6=sab
  const offset = (jsDay + 6) % 7; // lunes=0

  const cells: Array<{ date: Date | null }> = [];
  for (let i = 0; i < offset; i++) cells.push({ date: null });
  for (let d = 1; d <= totalDays; d++) cells.push({ date: new Date(monthStart.getFullYear(), monthStart.getMonth(), d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });

  const headerLabel = monthStart.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const selectDay = (day: Date) => {
    if (props.disabled) return;

    // si no hay start o ya hay rango completo, reiniciar start
    if (!isYmd(tempStart) || (isYmd(tempStart) && isYmd(tempEnd))) {
      const ymd = toYmd(day);
      setTempStart(ymd);
      setTempEnd("");
      return;
    }

    // si hay start y no end
    const s = clampDate(parseYmd(tempStart));
    const picked = day;

    if (isBefore(picked, s) || isSameDay(picked, s)) {
      // si elige antes/igual, reiniciar start
      const ymd = toYmd(picked);
      setTempStart(ymd);
      setTempEnd("");
      return;
    }

    // set end
    const ymdEnd = toYmd(picked);
    setTempEnd(ymdEnd);
  };

  const apply = () => {
    if (!isYmd(tempStart) || !isYmd(tempEnd)) return;
    props.onChange({ checkInDate: tempStart, checkOutDate: tempEnd });
    setOpen(false);
  };

  const clear = () => {
    setTempStart(props.checkInDate);
    setTempEnd(props.checkOutDate);
    setOpen(false);
  };

  const pretty = (ymd: string) => {
    if (!isYmd(ymd)) return "";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {props.label ? <span style={{ fontWeight: 700 }}>{props.label}</span> : null}

      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 12,
            padding: 10,
            borderRadius: 10,
            border,
            background: "var(--color-surface)",
            color: "var(--color-text)",
            cursor: props.disabled ? "not-allowed" : "pointer",
            opacity: props.disabled ? 0.6 : 1,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: isYmd(props.checkInDate) ? "var(--color-text)" : "var(--color-text-muted)",
            }}
          >
            {isYmd(props.checkInDate) ? pretty(props.checkInDate) : "Check-in"}
          </span>
          <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>→</span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: isYmd(props.checkOutDate) ? "var(--color-text)" : "var(--color-text-muted)",
            }}
          >
            {isYmd(props.checkOutDate) ? pretty(props.checkOutDate) : "Check-out"}
          </span>
          <span style={{ color: "var(--color-text-muted)", flexShrink: 0, marginLeft: "auto" }}>▼</span>
        </button>

        {open ? (
          <div
            style={{
              position: "absolute",
              zIndex: 60,
              marginTop: 8,
              width: "min(520px, 100%)",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 12,
                borderBottom: "1px solid var(--color-border)",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                style={{
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text)",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                ←
              </button>

              <div style={{ fontWeight: 800, color: "var(--color-accent)", textTransform: "capitalize" }}>
                {headerLabel}
              </div>

              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, +1))}
                style={{
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text)",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                →
              </button>
            </div>

            {/* Weekdays */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                padding: "10px 12px 0 12px",
                gap: 6,
                fontSize: 12,
                color: "var(--color-text-muted)",
              }}
            >
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ textAlign: "center", fontWeight: 700 }}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 6,
                padding: 12,
              }}
            >
              {cells.map((c, idx) => {
                if (!c.date) return <div key={idx} />;

                const day = c.date;
                const ymd = toYmd(day);

                const startOk = isYmd(tempStart);
                const endOk = isYmd(tempEnd);

                const isStart = startOk && isSameDay(day, startDateObj);
                const isEnd = endOk && isSameDay(day, endDateObj);
                const inRange = startOk && endOk && isBetween(day, startDateObj, endDateObj);

                const bg = isStart || isEnd
                  ? "var(--color-primary)"
                  : inRange
                    ? "rgba(44,100,101,0.18)"
                    : "transparent";

                const color = isStart || isEnd ? "var(--color-primary-contrast)" : "var(--color-text)";

                return (
                  <button
                    key={ymd}
                    type="button"
                    onClick={() => selectDay(day)}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 10,
                      border: "1px solid var(--color-border)",
                      background: bg,
                      color,
                      cursor: "pointer",
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                padding: 12,
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={clear}
                style={{
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={apply}
                disabled={!isYmd(tempStart) || !isYmd(tempEnd)}
                style={{
                  border: "1px solid var(--color-primary)",
                  background: "var(--color-primary)",
                  color: "var(--color-primary-contrast)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                  opacity: !isYmd(tempStart) || !isYmd(tempEnd) ? 0.6 : 1,
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
