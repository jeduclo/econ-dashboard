"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtDate, fmtPct, fmtValue, loadMeta, loadShard, pct, resolveOption, yearAgo, type Series } from "@/lib/data";

interface Tile { href: string; label: string; value: string; sub: string }

async function headline(id: string, shardDefault: string | null, match: Record<string, string>) {
  const meta = (await loadMeta()).datasets[id];
  if (!meta) return null;
  const shard = shardDefault
    ? meta.shards.find((s) => s.value === resolveOption(meta.shards.map((x) => x.value ?? ""), shardDefault))
    : meta.shards[0];
  if (!shard) return null;
  const series: Series[] = await loadShard(shard.file);
  const resolved = Object.fromEntries(Object.entries(match).map(([k, v]) => [k, resolveOption(shard.options[k] ?? [], v)]));
  const s = series.find((x) => Object.entries(resolved).every(([k, v]) => x.key[k] === v));
  return s ? { points: s.points, unit: shard.unit, freq: meta.freq } : null;
}

export default function Glance() {
  const [tiles, setTiles] = useState<(Tile | null)[]>([null, null, null, null]);
  useEffect(() => {
    const yoyTile = (href: string, label: string, h: Awaited<ReturnType<typeof headline>>): Tile | null => {
      if (!h) return null;
      const i = h.points.length - 1, q = yearAgo(h.points, i);
      return { href, label, value: fmtPct(q ? pct(h.points[i].v, q.v) : NaN), sub: fmtDate(h.points[i].d, h.freq) };
    };
    Promise.all([
      headline("gdp", null, { component: "Gross domestic product at market prices" }).then((h) => yoyTile("/gdp/", "Real GDP growth, year on year", h)),
      headline("cpi", "Canada", { product: "All-items" }).then((h) => yoyTile("/cpi/", "CPI inflation, 12-month", h)),
      headline("lm", "Canada", { indicator: "Unemployment rate", sex: "Total", age_group: "15 years and over" }).then((h) =>
        h ? { href: "/lm/", label: "Unemployment rate", value: fmtValue(h.points.at(-1)!.v, h.unit), sub: fmtDate(h.points.at(-1)!.d, h.freq) } : null),
      headline("pop", null, { region: "Canada" }).then((h) =>
        h ? { href: "/pop/", label: "Population", value: (h.points.at(-1)!.v / 1e6).toFixed(2) + " million", sub: fmtDate(h.points.at(-1)!.d, h.freq) } : null),
    ]).then(setTiles).catch(() => {});
  }, []);
  return (
    <section className="glance" aria-label="Canada at a glance">
      {tiles.map((t, i) =>
        t ? (
          <Link key={t.href} href={t.href} className="kpi">
            <div className="label">{t.label}</div>
            <div className="value">{t.value}</div>
            <div className="sub">{t.sub}</div>
          </Link>
        ) : (
          <div key={i} className="kpi"><div className="label">&nbsp;</div><div className="value">…</div><div className="sub">&nbsp;</div></div>
        ),
      )}
    </section>
  );
}
