import { describe, it, expect } from 'vitest';
import {
  windowNotice,
  anonymousNodeNotice,
  isQuiet,
  renderNotices,
  RFC_005_COMMENT_WINDOW_END,
  RFC_005_FCP_END,
  RFC_005_URL,
  IMPLEMENTORS_URL,
} from '../notices.js';

const DURING_WINDOW = Date.parse('2026-08-23T12:00:00Z');
const LAST_FCP_DAY = Date.parse('2026-09-13T23:59:59Z');
const JUST_AFTER_FCP = Date.parse('2026-09-14T00:00:01Z');
const OCTOBER = Date.parse('2026-10-01T09:00:00Z');

describe('windowNotice — expiry gate', () => {
  it('prints during the comment window, with both dates and the PR link', () => {
    const notice = windowNotice(DURING_WINDOW);
    expect(notice).not.toBeNull();
    expect(notice).toContain(RFC_005_COMMENT_WINDOW_END);
    expect(notice).toContain(RFC_005_FCP_END);
    expect(notice).toContain(RFC_005_URL);
  });

  it('still prints on the last day of the final comment period', () => {
    expect(windowNotice(LAST_FCP_DAY)).not.toBeNull();
  });

  it('goes silent once the final comment period has closed', () => {
    expect(windowNotice(JUST_AFTER_FCP)).toBeNull();
  });

  it('is silent for a host installing in October', () => {
    expect(windowNotice(OCTOBER)).toBeNull();
  });

  it('is at most three lines', () => {
    expect(windowNotice(DURING_WINDOW)!.split('\n')).toHaveLength(3);
  });
});

describe('anonymousNodeNotice', () => {
  it('prints for an unidentified node, naming the variables and the listing', () => {
    const notice = anonymousNodeNotice(false);
    expect(notice).not.toBeNull();
    expect(notice).toContain('SERVICIALO_IMPL_NAME');
    expect(notice).toContain(IMPLEMENTORS_URL);
    expect(notice).toContain('SHA-256');
  });

  it('is silent once the node identifies itself', () => {
    expect(anonymousNodeNotice(true)).toBeNull();
  });

  it('is at most three lines', () => {
    expect(anonymousNodeNotice(false)!.split('\n')).toHaveLength(3);
  });

  it('promises only what ships: listing after verification, never inbound contact', () => {
    // `impl_contact_hash` is a one-way digest. Nothing can be delivered to it,
    // so the notice must not imply that anything will be.
    const notice = anonymousNodeNotice(false)!.toLowerCase();
    expect(notice).toContain('once verified');
    for (const claim of ['receive', 'announcement', 'newsletter', 'we will contact']) {
      expect(notice).not.toContain(claim);
    }
  });
});

describe('isQuiet', () => {
  it.each([['true'], ['TRUE'], ['1'], [' true ']])('treats %j as quiet', (value) => {
    expect(isQuiet({ SERVICIALO_QUIET: value })).toBe(true);
  });

  it.each([[undefined], [''], ['false'], ['0'], ['no']])('treats %j as not quiet', (value) => {
    expect(isQuiet({ SERVICIALO_QUIET: value })).toBe(false);
  });
});

describe('renderNotices', () => {
  const base = { telemetryEnabled: true, identified: false, now: DURING_WINDOW, env: {} };

  it('renders both notices for an anonymous node during the window', () => {
    const block = renderNotices(base)!;
    expect(block).toContain(RFC_005_URL);
    expect(block).toContain(IMPLEMENTORS_URL);
  });

  it('always offers the way to silence itself', () => {
    expect(renderNotices(base)).toContain('SERVICIALO_QUIET=true');
  });

  it('renders nothing when SERVICIALO_QUIET is set', () => {
    expect(renderNotices({ ...base, env: { SERVICIALO_QUIET: 'true' } })).toBeNull();
  });

  it('keeps the window notice when telemetry is opted out, and drops the identity one', () => {
    // Opting out of telemetry is not a request to stop hearing about the spec,
    // but a node that sends nothing cannot send an identity either.
    const block = renderNotices({ ...base, telemetryEnabled: false })!;
    expect(block).toContain(RFC_005_URL);
    expect(block).not.toContain(IMPLEMENTORS_URL);
  });

  it('drops the identity notice for a node that already identifies itself', () => {
    const block = renderNotices({ ...base, identified: true })!;
    expect(block).not.toContain(IMPLEMENTORS_URL);
    expect(block).toContain(RFC_005_URL);
  });

  it('renders nothing at all once the window expired and the node is identified', () => {
    expect(renderNotices({ ...base, identified: true, now: OCTOBER })).toBeNull();
  });

  it('still nudges an anonymous node after the window has closed', () => {
    const block = renderNotices({ ...base, now: OCTOBER })!;
    expect(block).toContain(IMPLEMENTORS_URL);
    expect(block).not.toContain(RFC_005_URL);
  });
});
