"use client";
import { useEffect, useState } from "react";
import { dataUrl, fmtBytes, fmtValue, type DatasetMeta } from "@/lib/data";
import { saveBlob, toCsv, toXlsx, type Row } from "@/lib/export";

const PAGE = 25;

export function DataTable({ columns, rows, value }: { columns: string[]; rows: Row[]; value: string }) {
  const [page, setPage] = useState(0);
  const sorted = [...rows].reverse(); // newest first
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  useEffect(() => setPage(0), [rows]);
  const cols = columns.filter((c) => c !== "unit");
  const numeric = (c: string) => c === value || ["open", "high", "low", "close", "volume"].includes(c);
  return (
    <section className="card">
      <h3>Data table</h3>
      <p className="note">{rows.length.toLocaleString("en-CA")} rows match your filters{rows[0]?.unit ? `. Unit: ${rows[0].unit}` : ""}</p>
      <div className="table-wrap">
        <table>
          <thead><tr>{cols.map((c) => <th key={c} className={numeric(c) ? "num" : ""}>{c}</th>)}</tr></thead>
          <tbody>
            {sorted.slice(page * PAGE, page * PAGE + PAGE).map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c} className={numeric(c) ? "num" : ""}>
                    {numeric(c) && typeof r[c] === "number" ? fmtValue(r[c] as number) : String(r[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button onClick={() => setPage(page - 1)} disabled={page === 0}>Newer</button>
        <span>Page {page + 1} of {pages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= pages - 1}>Older</button>
      </div>
    </section>
  );
}

export function DownloadSlip({ id, meta, rows, filters, range }: {
  id: string; meta: DatasetMeta; rows: Row[]; filters: [string, string][]; range: string;
}) {
  const [scope, setScope] = useState<"filtered" | "full">("filtered");
  const [busy, setBusy] = useState<"" | "csv" | "xlsx">("");
  const stamp = new Date().toISOString().slice(0, 10);

  async function download(fmt: "csv" | "xlsx") {
    setBusy(fmt);
    try {
      const name = `${id}_filtered_${stamp}.${fmt}`;
      if (fmt === "csv") saveBlob(toCsv(meta.columns, rows), name);
      else {
        const about: [string, string][] = [
          ["Dataset", meta.title], ["Source", meta.source], ["Date range", range],
          ...filters.map(([k, v]) => [`Filter: ${k}`, v] as [string, string]),
          ["Rows", String(rows.length)], ["Downloaded", stamp],
          ["Complete dataset", `${location.origin}${dataUrl(meta.downloads.xlsx.file)}`],
        ];
        saveBlob(await toXlsx(meta.columns, rows, about), name);
      }
    } finally {
      setBusy("");
    }
  }

  return (
    <aside className="slip" aria-label="Download data">
      <h3>Download the data</h3>
      <p className="lede">Clean, long-format tables with one row per date and series.</p>
      <div className="seg" role="group" aria-label="What to download">
        <button aria-pressed={scope === "filtered"} onClick={() => setScope("filtered")}>Your selection</button>
        <button aria-pressed={scope === "full"} onClick={() => setScope("full")}>Complete dataset</button>
      </div>
      <dl className="receipt">
        {scope === "filtered" ? (
          <>
            <div><dt>Rows</dt><dd>{rows.length.toLocaleString("en-CA")}</dd></div>
            <div><dt>Dates</dt><dd>{range}</dd></div>
            {filters.map(([k, v]) => <div key={k}><dt>{k}</dt><dd title={v}>{v}</dd></div>)}
          </>
        ) : (
          <>
            <div><dt>Rows</dt><dd>{meta.rows.toLocaleString("en-CA")}</dd></div>
            <div><dt>Dates</dt><dd>{meta.start.slice(0, 7)} to {meta.end.slice(0, 7)}</dd></div>
            <div><dt>Columns</dt><dd title={meta.columns.join(", ")}>{meta.columns.join(", ")}</dd></div>
          </>
        )}
      </dl>
      {scope === "filtered" ? (
        <div className="dl-buttons">
          <button className="btn" disabled={!rows.length || !!busy} onClick={() => download("csv")}>{busy === "csv" ? "Preparing…" : "CSV"}</button>
          <button className="btn secondary" disabled={!rows.length || !!busy} onClick={() => download("xlsx")}>{busy === "xlsx" ? "Preparing…" : "Excel"}</button>
        </div>
      ) : (
        <div className="dl-buttons">
          <a className="btn" href={dataUrl(meta.downloads.csv.file)} download>CSV ({fmtBytes(meta.downloads.csv.bytes)})</a>
          <a className="btn secondary" href={dataUrl(meta.downloads.xlsx.file)} download>Excel ({fmtBytes(meta.downloads.xlsx.bytes)})</a>
        </div>
      )}
      <p className="fine">
        {scope === "filtered"
          ? "Built in your browser from the series shown, at the chosen interval. Values are as published, not transformed."
          : `Every region, series and date. ${meta.source}.`}
      </p>
    </aside>
  );
}
