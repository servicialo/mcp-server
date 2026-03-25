import { worldPaths } from "@/lib/world-map-paths";

interface WorldMapProps {
  /** Map of uppercase country code → instance count */
  countryData: Record<string, number>;
}

/**
 * Choropleth world map. Countries with telemetry instances are filled
 * with the accent color at an opacity proportional to their share
 * of total instances. Countries without data are neutral grey.
 *
 * SVG source: simple-world-map (CC BY-SA 3.0, Al MacDonald / Fritz Lekschas)
 * IDs are lowercase ISO 3166-1 alpha-2 codes.
 */
export function WorldMap({ countryData }: WorldMapProps) {
  const maxCount = Math.max(...Object.values(countryData), 1);

  // Build a lookup: lowercase code → opacity (0.15 .. 1.0)
  const fills = new Map<string, number>();
  for (const [code, count] of Object.entries(countryData)) {
    // Log scale for better visual spread when counts vary widely
    const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
    // Clamp to 0.15–1.0 so even 1-instance countries are visible
    fills.set(code.toLowerCase(), 0.15 + ratio * 0.85);
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface p-4 md:p-6">
      <svg
        viewBox="30.767 241.591 784.077 458.627"
        className="w-full h-auto"
        aria-label="World map showing telemetry instance distribution by country"
        role="img"
      >
        {worldPaths.map(({ id, d }) => {
          const opacity = fills.get(id);
          const isActive = opacity !== undefined;

          if (d.length === 1) {
            return (
              <path
                key={id}
                d={d[0]}
                fill={isActive ? `var(--color-accent)` : `var(--color-surface-alt)`}
                fillOpacity={isActive ? opacity : 0.6}
                stroke="var(--color-border)"
                strokeWidth={0.3}
                strokeOpacity={0.5}
              >
                {isActive && (
                  <title>{`${id.toUpperCase()}: ${countryData[id.toUpperCase()] ?? 0} instances`}</title>
                )}
              </path>
            );
          }

          // Multi-path countries (islands, territories)
          return (
            <g key={id}>
              {d.map((path, i) => (
                <path
                  key={`${id}-${i}`}
                  d={path}
                  fill={isActive ? `var(--color-accent)` : `var(--color-surface-alt)`}
                  fillOpacity={isActive ? opacity : 0.6}
                  stroke="var(--color-border)"
                  strokeWidth={0.3}
                  strokeOpacity={0.5}
                />
              ))}
              {isActive && (
                <title>{`${id.toUpperCase()}: ${countryData[id.toUpperCase()] ?? 0} instances`}</title>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
