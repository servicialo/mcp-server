/**
 * Startup notices — stderr only.
 *
 * This server speaks JSON-RPC over stdout. Anything on stdout that is not a
 * protocol message corrupts the stream for every client, so every notice here
 * goes to stderr. `src/__tests__/stdout-purity.test.ts` spawns the built server
 * and proves stdout stays clean up to the first protocol message.
 *
 * Both notices print once per process. There is deliberately no sentinel file:
 * these exist to be discovered, and a sentinel hides them from the operator who
 * has not acted on them yet. `SERVICIALO_QUIET=true` silences both — and only
 * these two. The mode banner and the first-run telemetry notice keep their
 * existing behavior; a patch release does not redefine existing output.
 */

/** Comment window close for RFC-005, per PR #21's process metadata. */
export const RFC_005_COMMENT_WINDOW_END = '2026-09-06';

/** Final comment period close. The window notice stops printing after this day. */
export const RFC_005_FCP_END = '2026-09-13';

export const RFC_005_URL = 'https://github.com/servicialo/mcp-server/pull/21';

export const IMPLEMENTORS_URL = 'https://servicialo.com/implementors';

/**
 * The instant the window notice goes silent: end of the last FCP day, UTC.
 * A host installing in October must not be greeted by a dead announcement.
 */
const WINDOW_NOTICE_EXPIRES_AT = Date.parse(`${RFC_005_FCP_END}T23:59:59.999Z`);

type Env = Record<string, string | undefined>;

/** True when the operator asked for the new notices to stay silent. */
export function isQuiet(env: Env = process.env): boolean {
  const raw = env.SERVICIALO_QUIET?.trim().toLowerCase();
  return raw === 'true' || raw === '1';
}

/**
 * The RFC-005 comment-window notice, or null once the FCP has closed.
 *
 * Independent of `SERVICIALO_TELEMETRY`: this is an announcement about the
 * protocol, not a telemetry emission, and opting out of telemetry is not a
 * request to stop hearing about the specification.
 */
export function windowNotice(now: number = Date.now()): string | null {
  if (now > WINDOW_NOTICE_EXPIRES_AT) return null;
  return [
    `  Servicialo RFC-005 (period deliveries) is open for comment through ${RFC_005_COMMENT_WINDOW_END};`,
    `  final comment period through ${RFC_005_FCP_END}. Review and comment:`,
    `  ${RFC_005_URL}`,
  ].join('\n');
}

/**
 * The anonymous-node notice, or null when this node already identifies itself.
 *
 * Claims only what the shipped code delivers: a verified implementation is
 * rendered on /implementors, and the contact email is hashed before it leaves
 * the host. It does not promise announcements — `impl_contact_hash` is a
 * one-way digest and cannot be used to reach anyone.
 */
export function anonymousNodeNotice(identified: boolean): string | null {
  if (identified) return null;
  return [
    '  This node is anonymous in the network. SERVICIALO_IMPL_NAME / _URL / _CONTACT',
    `  list your implementation on ${IMPLEMENTORS_URL} once verified.`,
    '  The contact email is hashed (SHA-256) on this machine before it is sent.',
  ].join('\n');
}

export interface NoticeOptions {
  /** Whether telemetry is enabled; the anonymous-node notice is moot without it. */
  telemetryEnabled: boolean;
  /** Whether this node already sets at least one identity variable. */
  identified: boolean;
  now?: number;
  env?: Env;
  /** Sink for the rendered block. Defaults to stderr — never stdout. */
  write?: (chunk: string) => void;
}

/**
 * Render the startup notice block, or null when nothing is due.
 *
 * Kept pure so the gates are testable without spawning a process or capturing
 * a stream.
 */
export function renderNotices(
  opts: Omit<NoticeOptions, 'write'>,
): string | null {
  const { telemetryEnabled, identified, now = Date.now(), env = process.env } = opts;
  if (isQuiet(env)) return null;

  const blocks = [
    windowNotice(now),
    // A node that opted out of telemetry sends no identity either — telling it
    // to identify itself would be noise.
    telemetryEnabled ? anonymousNodeNotice(identified) : null,
  ].filter((b): b is string => b !== null);

  if (blocks.length === 0) return null;

  return `\n${blocks.join('\n\n')}\n\n  Silence these notices with SERVICIALO_QUIET=true\n`;
}

/** Write the due notices to stderr. */
export function printStartupNotices(opts: NoticeOptions): void {
  const { write = (chunk: string) => process.stderr.write(chunk) } = opts;
  const block = renderNotices(opts);
  if (block) write(block);
}
