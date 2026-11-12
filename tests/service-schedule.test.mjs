import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const directory = path.dirname(fileURLToPath(import.meta.url));
// Use the project's existing TypeScript compiler; no new test dependencies.
function loadSource(file) {
  const filename = path.resolve(directory, '..', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}
const { getWeeklyService, nextWednesdayDate } = loadSource('src/lib/service-schedule.ts');
const { validateWednesdayContent } = loadSource('src/lib/wednesday-content.ts');
const shared = 'https://meet.google.com/hqk-sryh-ado';
const content = { googleMeetLink: shared, serviceSchedule: { dayOfWeek: 3, hour: 19, minute: 30, timezone: 'America/New_York' } };
const at = (time, values = content) => getWeeklyService(values, new Date(time));

test('Sunday hands off at exactly 1 PM Eastern, even when the old schedule is Wednesday', () => {
  const live = at('2026-11-15T17:59:59Z');
  assert.equal(live.kind, 'sunday');
  assert.equal(live.isLive, true);
  assert.equal(live.startsAt.toISOString(), '2026-11-15T16:30:00.000Z');
  const next = at('2026-11-15T18:00:00Z');
  assert.equal(next.kind, 'wednesday');
  assert.equal(next.startsAt.toISOString(), '2026-11-19T00:30:00.000Z');
  assert.equal(next.endsAt.toISOString(), '2026-11-19T02:30:00.000Z');
  assert.equal(next.meetLink, shared);
});

test('Wednesday becomes live at 7:30 PM and hands off to Sunday at exactly 9:30 PM', () => {
  assert.equal(at('2026-11-19T00:29:59Z').isLive, false);
  assert.equal(at('2026-11-19T00:30:00Z').isLive, true);
  assert.equal(at('2026-11-19T02:29:59Z').kind, 'wednesday');
  const next = at('2026-11-19T02:30:00Z');
  assert.equal(next.kind, 'sunday');
  assert.equal(next.isLive, false);
  assert.equal(next.startsAt.toISOString(), '2026-11-22T16:30:00.000Z');
});

test('Eastern DST uses the correct UTC times in summer, winter and the transition week', () => {
  assert.equal(at('2026-07-08T23:30:00Z').startsAt.toISOString(), '2026-07-08T23:30:00.000Z');
  assert.equal(at('2026-01-08T00:30:00Z').startsAt.toISOString(), '2026-01-08T00:30:00.000Z');
  assert.equal(at('2026-03-08T15:30:00Z').kind, 'sunday');
  assert.equal(at('2026-03-08T17:00:00Z').startsAt.toISOString(), '2026-03-11T23:30:00.000Z');
  assert.equal(at('2026-11-01T16:30:00Z').kind, 'sunday');
});

test('a visitor timezone cannot move the ministry session', () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ['America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Auckland', 'UTC']) {
      process.env.TZ = timezone;
      assert.equal(at('2026-11-19T00:30:00Z').startsAt.toISOString(), '2026-11-19T00:30:00.000Z');
    }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});

test('Wednesday details and link are independent, and past sermons never carry forward', () => {
  const values = { ...content, thisSunday: { date: '2026-11-15', title: 'Sunday title' }, thisWednesday: { date: '2026-11-18', title: 'Wednesday hope', scripture: 'John 3:16', description: 'Midweek Scripture' }, wednesdayMeetLink: 'https://meet.google.com/abc-defg-hij' };
  assert.equal(at('2026-11-16T12:00:00Z', values).title, 'Wednesday hope');
  assert.equal(at('2026-11-16T12:00:00Z', values).meetLink, values.wednesdayMeetLink);
  assert.equal(at('2026-11-15T16:30:00Z', values).title, 'Sunday title');
  assert.equal(at('2026-11-15T16:30:00Z', values).meetLink, shared);
  assert.equal(at('2026-11-23T12:00:00Z', values).title, 'Wednesday Service');
  assert.equal(at('2026-11-23T12:00:00Z', values).scripture, '');
  assert.equal(at('2026-11-16T12:00:00Z', { ...values, wednesdayMeetLink: 'https://meet.google.com.evil.example/room' }).meetLink, shared);
});

test('Sunday legacy timezone settings remain usable without changing Wednesday', () => {
  const values = { ...content, serviceSchedule: { dayOfWeek: 0, hour: 8, minute: 30, timezone: 'America/Los_Angeles' } };
  assert.equal(at('2026-11-15T16:30:00Z', values).isLive, true);
  assert.equal(at('2026-11-16T12:00:00Z', values).startsAt.toISOString(), '2026-11-19T00:30:00.000Z');
  assert.equal(nextWednesdayDate(new Date('2026-11-19T01:00:00Z')), '2026-11-18');
  assert.equal(nextWednesdayDate(new Date('2026-11-19T02:30:00Z')), '2026-11-25');
});

test('Wednesday saves validate date, field limits and the real Google Meet host', () => {
  const details = { date: '2026-11-18', title: ' Hope ', scripture: 'John 3:16', description: 'Join us' };
  assert.deepEqual(validateWednesdayContent({ thisWednesday: details, wednesdayMeetLink: '' }).thisWednesday, { ...details, title: 'Hope' });
  for (const date of ['2026-11-16', '2026-02-30', 'not-a-date']) assert.throws(() => validateWednesdayContent({ thisWednesday: { ...details, date } }));
  assert.throws(() => validateWednesdayContent({ thisWednesday: { ...details, title: 'x'.repeat(61) } }));
  for (const url of ['http://meet.google.com/room', 'https://meet.google.com.evil.example/room', 'https://user:pass@meet.google.com/room', 'https://meet.google.com', 'https://meet.google.com/abc-defg-hij#invalid', 'javascript:alert(1)']) assert.throws(() => validateWednesdayContent({ wednesdayMeetLink: url }));
  assert.deepEqual(validateWednesdayContent({ weeklyMessage: { title: 'Existing Sunday' } }), { weeklyMessage: { title: 'Existing Sunday' } });
});

test('a malformed old Sunday timezone cannot inherit a visitor timezone', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Tokyo';
    for (const timezone of [undefined, '', 'invalid-zone']) {
      const values = { ...content, serviceSchedule: { dayOfWeek: 0, hour: 11, minute: 30, timezone } };
      assert.equal(at('2026-11-15T16:30:00Z', values).startsAt.toISOString(), '2026-11-15T16:30:00.000Z');
    }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});
