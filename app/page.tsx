import Link from "next/link";
import Glance from "@/components/Glance";
import { GROUPS, INDICATORS } from "@/lib/indicators";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>How Canada&apos;s economy is doing, in the numbers</h1>
        <p>
          Thirteen indicators from Statistics Canada and the markets, refreshed automatically. Explore each one with
          charts, then download the clean data as CSV or Excel for your own analysis.
        </p>
      </section>
      <Glance />
      <h2 className="section-h">Indicators</h2>
      <div className="index">
        {GROUPS.map((g) => (
          <div className="index-group" key={g}>
            <h3>{g}</h3>
            {INDICATORS.filter((i) => i.group === g).map((i) => (
              <Link key={i.id} href={`/${i.id}/`}>
                <b>{i.name}</b>
                <span>{i.tagline}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
      <p><Link href="/downloads/">See every dataset and download it in one place</Link></p>
    </>
  );
}
