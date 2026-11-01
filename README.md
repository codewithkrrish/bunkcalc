# BunkCalc

I built this because, in my first semester, I kept doing the same mental maths
before every class I wanted to skip: if I miss this one, does my attendance
still clear 75%? I would open a calculator app, guess, and usually get it wrong
in a hurry. BunkCalc answers that one question properly, for each subject and
for the semester as a whole.

## What it does

- Per-subject rows: rename the subject, enter classes attended and classes held.
- A target selector (60–90% presets, plus any custom value from 0–100).
- For every subject and for the overall total, two numbers that actually matter:
  how many more classes you can bunk, and how many you must attend in a row
  to get back to target. Both directions, not just one.
- Colour-coded status (safe, at risk, below target), progress bars, and an
  overall summary card.
- A shareable result card: a 1080px PNG you can download, plus a print view.
- Add/remove subjects, quick +/− buttons, drag to reorder, localStorage so
  your numbers are still there when you come back, and JSON import/export
  if you want to move them to another device.

## The maths, in plain words

Bunkable classes come from solving attended / (held + n) >= target. The
must-attend number solves (attended + n) / (held + n) >= target for n, rounded
up. If you are already below target at 100%, there is no honest must-attend
number — the tool says so instead of inventing one. Edge cases like zero
classes held or attended exceeding held are handled in code and covered by
tests; see `js/attendance.js` and the harness notes.

## How to run it

There is no build step and no server to start. Open `index.html` in a browser,
or serve the folder with any static server. It is plain HTML, CSS, and
vanilla JavaScript modules — nothing is fetched from a CDN, and nothing you
type leaves your browser.

## What it does not do

This is the part I want to be straight about. BunkCalc treats every future
class as equal, which is not always true in real colleges: labs, double
periods, and weighted components exist. It does not know your institution's
attendance rule, medical-leave policy, or condonation process, and it cannot
see your official portal. If the portal and this tool disagree, believe the
portal, and double-check your target before you act on a bunk count. I would
rather the tool be boring and right than confident and wrong.

## Files

- `index.html` — page structure and meta tags
- `styles.css` — the dark theme, responsive layout, print rules
- `js/attendance.js` — the pure calculation module (DOM-free, tested)
- `js/main.js` — UI, storage, import/export, drag reorder
- `js/sharecard.js` — the 1080px canvas result card
- `favicon.svg`, `LICENSE`

## Licence

MIT — see `LICENSE`.
