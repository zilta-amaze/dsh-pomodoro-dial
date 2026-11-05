# Add dsh-pomodoro-dial

A floating Pomodoro timer for the Harness Web UI, mounted in `shell.overlay`.

## What it does

- Custom focus / short-break / long-break lengths (1–180 / 1–60 / 1–120 min), editable by stepper or by typing the number.
- Long break is every *N* rounds (default 4) and can be switched off completely — with it off, every round is followed by the short break and the counter counts up instead of wrapping.
- Five alarm sounds synthesized with the Web Audio API — bell, chime, wood block, beep, rising bell — plus silent. Choosing one previews it; volume and ring duration (5–60 s) are adjustable. No audio files are shipped.
- Collapse to a `24:59` pill with play/pause on it; drag the card anywhere and the position is remembered; timer and settings survive a page reload.
- English and Chinese through the Client locale service; all colours are `--dsw-alias-*` theme tokens, so it follows light and dark themes.

## How it is built

`package.json` declares `dsh.bundle` (patch at `cordis.patch.yml`) and `dsh.client` with `exports["./client"]`. The Host half (`index.js`) is intentionally empty; `client.js` registers one entry in the `shell.overlay` slot and owns a plain-JS timer engine. No runtime dependencies, no build step, no network requests — only `localStorage` and `AudioContext`.

## Relationship to the existing `causebefore/dsh-pomodoro`

Both are Pomodoro timers with a draggable panel, so the difference should be stated plainly:

- **Alarm sounds**: five synthesized chimes with preview, volume and ring-duration control (no audio assets), versus the existing entry's "in-app, sound and browser notifications".
- **Long break is optional**: a switch turns long breaks off entirely, with the round counter following.
- **Persistence**: running timer, phase, settings and widget position all survive a reload.

It does **not** claim a sidebar page, browser notifications, or a build step — it has none of those.

## Checklist

- [x] `dsh.bundle` patch + `cordis.patch.yml` at the repo root
- [x] Real, working Host + Client code, no dependencies, no build
- [x] README with install and usage, MIT licence
- [x] `dsh-plugin` topic added to the repository
- [ ] Repository is at least 1 day old (CI checks this)
