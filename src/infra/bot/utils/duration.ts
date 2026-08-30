const UNIT_MS: Record<string, number> = {
    d: 86_400_000,
    h: 3_600_000,
    m: 60_000,
    s: 1_000,
};

/** Parses "7d" / "12h" / "30m" / "45s" into milliseconds. Returns null if it doesn't match. */
export function parseDurationMs(value: string): number | null {
    const match = value.match(/^(\d+)([dhms])$/);
    if (!match) return null;

    const amount = parseInt(match[1], 10);
    return amount * UNIT_MS[match[2]];
}
