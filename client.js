window.__ModuleLoader__.load({
  id: 'dsh-pomodoro-dial',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'dsh-pomodoro-dial';
    const STATE_KEY = 'dsh-pomodoro-dial:state:v1';
    const UI_KEY = 'dsh-pomodoro-dial:ui:v1';
    const POS_KEY = 'dsh-pomodoro-dial:pos:v1';

    /* ------------------------------------------------------------------ */
    /* Text                                                               */
    /* ------------------------------------------------------------------ */

    const EN = {
      title: 'Pomodoro',
      statusReady: 'Ready',
      statusFocus: 'Focusing',
      statusBreak: 'Break time',
      statusPaused: 'Paused',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset',
      skip: 'Skip this phase',
      settings: 'Settings',
      collapse: 'Collapse',
      expand: 'Expand',
      roundLabel: 'Round {i} / {n}',
      workMinutes: 'Focus',
      shortMinutes: 'Break',
      longMinutes: 'Long break',
      longEvery: 'Long break every',
      longBreak: 'Long break',
      roundOnly: 'Round {i}',
      sound: 'Alarm sound',
      ringFor: 'Ring for',
      volume: 'Volume',
      autoNext: 'Auto-start next phase',
      preview: 'Preview',
      minUnit: 'min',
      secUnit: 'sec',
      roundUnit: 'rounds',
      decrease: 'Decrease',
      increase: 'Increase',
      dragHint: 'Drag the title to move',
      workDone: 'Focus finished — take a break',
      breakDone: 'Break over — back to focus',
      soundBell: 'Bell',
      soundChime: 'Chime',
      soundWood: 'Wood block',
      soundBeep: 'Beep',
      soundRise: 'Rising bell',
      soundNone: 'Silent',
    };

    const ZH = {
      title: '番茄钟',
      statusReady: '准备开始',
      statusFocus: '专注中',
      statusBreak: '休息中',
      statusPaused: '已暂停',
      start: '开始',
      pause: '暂停',
      resume: '继续',
      reset: '重置',
      skip: '跳过本段',
      settings: '设置',
      collapse: '收起',
      expand: '展开',
      roundLabel: '第 {i} / {n} 轮',
      workMinutes: '专注时长',
      shortMinutes: '休息时长',
      longMinutes: '长休时长',
      longEvery: '长休间隔',
      longBreak: '启用长休',
      roundOnly: '第 {i} 轮',
      sound: '闹铃音效',
      ringFor: '响铃时长',
      volume: '音量',
      autoNext: '自动开始下一段',
      preview: '试听',
      minUnit: '分钟',
      secUnit: '秒',
      roundUnit: '轮',
      decrease: '减少',
      increase: '增加',
      dragHint: '拖动标题可移动',
      workDone: '专注结束，休息一下',
      breakDone: '休息结束，继续专注',
      soundBell: '清脆铃',
      soundChime: '三音铃',
      soundWood: '木质敲击',
      soundBeep: '电子滴答',
      soundRise: '渐强钟声',
      soundNone: '静音',
    };

    /* ------------------------------------------------------------------ */
    /* Settings                                                           */
    /* ------------------------------------------------------------------ */

    const PRESET = {
      work: 25,
      short: 5,
      long: 15,
      longEvery: 4,
      longBreakEnabled: true,
      sound: 'bell',
      ringSeconds: 10,
      volume: 70,
      autoNext: true,
    };

    const LIMITS = {
      work: [1, 180],
      short: [1, 60],
      long: [1, 120],
      longEvery: [2, 12],
      ringSeconds: [5, 60],
    };

    const SOUNDS = ['bell', 'chime', 'wood', 'beep', 'rise', 'none'];
    const RING_OPTIONS = [5, 10, 20, 30, 60];

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function normalizeSettings(raw) {
      const next = { ...PRESET };
      if (raw && typeof raw === 'object') {
        for (const key of ['work', 'short', 'long', 'longEvery', 'ringSeconds']) {
          const value = Number(raw[key]);
          if (Number.isFinite(value)) {
            next[key] = clamp(Math.round(value), LIMITS[key][0], LIMITS[key][1]);
          }
        }
        if (RING_OPTIONS.indexOf(next.ringSeconds) < 0) {
          next.ringSeconds = RING_OPTIONS.reduce(
            (best, option) => (Math.abs(option - next.ringSeconds) < Math.abs(best - next.ringSeconds) ? option : best),
            RING_OPTIONS[0]);
        }
        if (SOUNDS.indexOf(raw.sound) >= 0) next.sound = raw.sound;
        const volume = Number(raw.volume);
        if (Number.isFinite(volume)) next.volume = clamp(Math.round(volume), 0, 100);
        if (typeof raw.autoNext === 'boolean') next.autoNext = raw.autoNext;
        if (typeof raw.longBreakEnabled === 'boolean') next.longBreakEnabled = raw.longBreakEnabled;
      }
      return next;
    }

    function readJSON(key) {
      try {
        const text = window.localStorage.getItem(key);
        return text ? JSON.parse(text) : null;
      } catch (error) {
        return null;
      }
    }

    function writeJSON(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        /* private mode / quota: the timer still works, it just forgets. */
      }
    }

    function formatTime(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000));
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    /* ------------------------------------------------------------------ */
    /* Alarm sounds: five synthesized chimes, no audio assets             */
    /* ------------------------------------------------------------------ */

    function tone(ac, out, at, freq, dur, type, gain, glide) {
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, at);
      if (glide) osc.frequency.exponentialRampToValueAtTime(glide, at + dur);
      amp.gain.setValueAtTime(0.0001, at);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(amp);
      amp.connect(out);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    }

    function pattern(fn, gap, tail) {
      fn.gap = gap;
      fn.tail = tail;
      return fn;
    }

    const PATTERNS = {
      bell: pattern((ac, out, at) => {
        tone(ac, out, at, 1046.5, 1.5, 'sine', 0.42);
        tone(ac, out, at, 1568, 1.1, 'sine', 0.18);
        tone(ac, out, at, 2093, 0.45, 'sine', 0.07);
      }, 1.7, 1.6),
      chime: pattern((ac, out, at) => {
        [523.25, 659.25, 783.99].forEach((freq, index) => {
          tone(ac, out, at + index * 0.22, freq, 0.95, 'triangle', 0.3);
        });
      }, 2.6, 1.5),
      wood: pattern((ac, out, at) => {
        tone(ac, out, at, 360, 0.09, 'square', 0.3, 190);
        tone(ac, out, at + 0.17, 360, 0.09, 'square', 0.24, 190);
      }, 1.3, 0.4),
      beep: pattern((ac, out, at) => {
        [0, 0.18, 0.36].forEach((offset) => {
          tone(ac, out, at + offset, 1000, 0.12, 'square', 0.16);
        });
      }, 1.5, 0.6),
      rise: pattern((ac, out, at) => {
        [659.25, 783.99, 1046.5].forEach((freq, index) => {
          tone(ac, out, at + index * 0.26, freq, 0.85, 'sine', 0.16 + index * 0.1);
        });
      }, 2.4, 1.3),
    };

    class Chime {
      constructor() {
        this.ac = null;
        this.master = null;
        this.active = false;
        this.timers = new Set();
      }

      context() {
        try {
          if (!this.ac) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtor) return null;
            this.ac = new AudioCtor();
          }
          if (this.ac.state === 'suspended') this.ac.resume().catch(() => {});
          return this.ac;
        } catch (error) {
          return null;
        }
      }

      ensure() {
        this.context();
      }

      stop() {
        this.active = false;
        for (const id of this.timers) clearTimeout(id);
        this.timers.clear();
        const master = this.master;
        this.master = null;
        if (!master || !this.ac) return;
        const now = this.ac.currentTime;
        try {
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
          master.gain.linearRampToValueAtTime(0.0001, now + 0.08);
        } catch (error) {
          /* ignore */
        }
        const timer = setTimeout(() => {
          try {
            master.disconnect();
          } catch (error) {
            /* ignore */
          }
        }, 260);
        this.timers.add(timer);
      }

      play(sound, volume, durationMs) {
        const ac = this.context();
        if (!ac || sound === 'none' || !(volume > 0) || !(durationMs > 0)) return;
        this.stop();
        const master = ac.createGain();
        master.gain.value = clamp(volume, 0.001, 1);
        master.connect(ac.destination);
        this.master = master;
        this.active = true;
        const until = Date.now() + durationMs;
        const step = () => {
          if (!this.active) return;
          if (Date.now() > until - 150) {
            this.stop();
            return;
          }
          const shape = PATTERNS[sound] || PATTERNS.bell;
          try {
            shape(ac, master, ac.currentTime + 0.03);
          } catch (error) {
            this.stop();
            return;
          }
          const timer = setTimeout(step, shape.gap * 1000);
          this.timers.add(timer);
        };
        step();
      }

      preview(sound, volume) {
        const ac = this.context();
        if (!ac || sound === 'none') return;
        this.stop();
        const master = ac.createGain();
        master.gain.value = clamp(volume, 0.001, 1);
        master.connect(ac.destination);
        const shape = PATTERNS[sound] || PATTERNS.bell;
        try {
          shape(ac, master, ac.currentTime + 0.02);
        } catch (error) {
          /* ignore */
        }
        const timer = setTimeout(() => {
          try {
            master.disconnect();
          } catch (error) {
            /* ignore */
          }
        }, (shape.tail + 0.4) * 1000);
        this.timers.add(timer);
      }

      dispose() {
        this.active = false;
        for (const id of this.timers) clearTimeout(id);
        this.timers.clear();
        if (this.master) {
          try {
            this.master.disconnect();
          } catch (error) {
            /* ignore */
          }
          this.master = null;
        }
        if (this.ac) {
          try {
            this.ac.close();
          } catch (error) {
            /* ignore */
          }
          this.ac = null;
        }
      }
    }

    /* ------------------------------------------------------------------ */
    /* Timer engine (lives outside React so a re-render never resets it)  */
    /* ------------------------------------------------------------------ */

    class PomodoroEngine {
      constructor(chime) {
        this.chime = chime;
        this.listeners = new Set();
        this.timer = null;
        this.noticeTimer = null;
        this.notice = null;

        const saved = readJSON(STATE_KEY) || {};
        this.settings = normalizeSettings(saved.settings);
        this.phase = saved.phase === 'short' || saved.phase === 'long' ? saved.phase : 'work';
        this.completed = Number.isFinite(saved.completed) ? Math.max(0, Math.floor(saved.completed)) : 0;
        this.status = 'idle';
        this.remaining = this.durationOf(this.phase);
        this.endsAt = 0;
        this.restore(saved);
        this.snapshot = this.build();
      }

      durationOf(phase) {
        if (phase === 'short') return this.settings.short * 60000;
        if (phase === 'long') return this.settings.long * 60000;
        return this.settings.work * 60000;
      }

      remainingMs() {
        if (this.status === 'running') return Math.max(0, this.endsAt - Date.now());
        return this.remaining;
      }

      build() {
        return {
          status: this.status,
          phase: this.phase,
          remaining: this.remainingMs(),
          total: this.durationOf(this.phase),
          completed: this.completed,
          notice: this.notice,
          settings: this.settings,
        };
      }

      getSnapshot() {
        return this.snapshot;
      }

      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }

      publish() {
        this.snapshot = this.build();
        for (const listener of Array.from(this.listeners)) {
          try {
            listener();
          } catch (error) {
            /* a broken listener must not stop the clock */
          }
        }
      }

      restore(saved) {
        if (saved.status === 'running' && Number.isFinite(saved.endsAt)) {
          const remaining = saved.endsAt - Date.now();
          if (remaining > 250) {
            this.status = 'running';
            this.endsAt = saved.endsAt;
            this.remaining = remaining;
            this.startLoop();
            return;
          }
          // The phase finished while the page was closed: advance silently.
          const wasWork = this.phase === 'work';
          if (wasWork) this.completed += 1;
          const next = wasWork
            ? (this.settings.longBreakEnabled && this.completed % this.settings.longEvery === 0 ? 'long' : 'short')
            : 'work';
          this.phase = next;
          this.remaining = this.durationOf(next);
          this.status = 'idle';
          this.persist();
          return;
        }
        if (saved.status === 'paused' && Number.isFinite(saved.remaining)) {
          this.status = 'paused';
          this.remaining = clamp(saved.remaining, 0, this.durationOf(this.phase));
        }
      }

      persist() {
        writeJSON(STATE_KEY, {
          v: 1,
          settings: this.settings,
          phase: this.phase,
          status: this.status,
          endsAt: this.endsAt,
          remaining: this.remaining,
          completed: this.completed,
        });
      }

      startLoop() {
        if (this.timer) return;
        this.timer = setInterval(() => this.sync(), 250);
      }

      stopLoop() {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }

      sync() {
        if (this.status !== 'running') {
          this.stopLoop();
          return;
        }
        if (this.endsAt - Date.now() <= 0) {
          this.complete(false);
          return;
        }
        this.publish();
      }

      toggle() {
        if (this.status === 'running') this.pause();
        else this.start();
      }

      start() {
        this.chime.ensure();
        this.chime.stop();
        if (this.remaining <= 0) this.remaining = this.durationOf(this.phase);
        this.status = 'running';
        this.endsAt = Date.now() + this.remaining;
        this.notice = null;
        this.clearNotice();
        this.startLoop();
        this.persist();
        this.publish();
      }

      pause() {
        if (this.status !== 'running') return;
        this.chime.stop();
        this.remaining = Math.max(0, this.endsAt - Date.now());
        this.endsAt = 0;
        this.status = 'paused';
        this.stopLoop();
        this.persist();
        this.publish();
      }

      reset() {
        this.chime.stop();
        this.stopLoop();
        this.clearNotice();
        this.notice = null;
        this.status = 'idle';
        this.endsAt = 0;
        this.remaining = this.durationOf(this.phase);
        this.persist();
        this.publish();
      }

      skip() {
        this.chime.stop();
        this.complete(true);
      }

      complete(silent) {
        const wasWork = this.phase === 'work';
        if (wasWork) this.completed += 1;
        const next = wasWork
          ? (this.settings.longBreakEnabled && this.completed % this.settings.longEvery === 0 ? 'long' : 'short')
          : 'work';
        this.phase = next;
        this.remaining = this.durationOf(next);
        this.endsAt = 0;
        this.status = 'idle';
        this.stopLoop();
        if (!silent) this.ring();
        this.flash(wasWork ? 'workDone' : 'breakDone');
        if (this.settings.autoNext) {
          this.status = 'running';
          this.endsAt = Date.now() + this.remaining;
          this.startLoop();
        }
        this.persist();
        this.publish();
      }

      ring() {
        this.chime.play(this.settings.sound, this.settings.volume / 100, this.settings.ringSeconds * 1000);
      }

      preview(sound) {
        this.chime.preview(sound, this.settings.volume / 100);
      }

      flash(key) {
        this.notice = key;
        this.clearNotice();
        this.noticeTimer = setTimeout(() => {
          this.noticeTimer = null;
          this.notice = null;
          this.publish();
        }, 12000);
      }

      clearNotice() {
        if (this.noticeTimer) {
          clearTimeout(this.noticeTimer);
          this.noticeTimer = null;
        }
      }

      updateSettings(patch) {
        const previous = this.settings;
        const next = normalizeSettings({ ...previous, ...patch });
        this.settings = next;
        const lengthChanged =
          next.work !== previous.work || next.short !== previous.short || next.long !== previous.long;
        if (lengthChanged && this.status === 'idle') {
          this.remaining = this.durationOf(this.phase);
        }
        this.persist();
        this.publish();
      }

      dispose() {
        this.stopLoop();
        this.clearNotice();
        this.listeners.clear();
        this.chime.dispose();
      }
    }

    /* ------------------------------------------------------------------ */
    /* Icons                                                              */
    /* ------------------------------------------------------------------ */

    function icon(name, size) {
      const side = size || 16;
      const props = {
        width: side,
        height: side,
        viewBox: '0 0 16 16',
        'aria-hidden': true,
        style: { display: 'block' },
      };
      if (name === 'play') {
        return h('svg', props, h('path', { d: 'M5.2 3.5v9l7.4-4.5z', fill: 'currentColor' }));
      }
      if (name === 'pause') {
        return h('svg', props,
          h('rect', { x: 4.5, y: 3.4, width: 2.4, height: 9.2, rx: 1, fill: 'currentColor' }),
          h('rect', { x: 9.1, y: 3.4, width: 2.4, height: 9.2, rx: 1, fill: 'currentColor' }));
      }
      if (name === 'reset') {
        return h('svg', props,
          h('path', {
            d: 'M13 8.2a5 5 0 1 1-1.7-3.8',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
          }),
          h('path', {
            d: 'M13.2 2.6v2.9h-2.9',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }));
      }
      if (name === 'skip') {
        return h('svg', props,
          h('path', { d: 'M3.8 3.6v8.8l6.3-4.4z', fill: 'currentColor' }),
          h('rect', { x: 11, y: 3.6, width: 1.8, height: 8.8, rx: 0.9, fill: 'currentColor' }));
      }
      if (name === 'settings') {
        return h('svg', props,
          h('path', {
            d: 'M2.6 5.2h10.8M2.6 10.8h10.8',
            stroke: 'currentColor',
            strokeWidth: 1.4,
            strokeLinecap: 'round',
          }),
          h('circle', { cx: 6, cy: 5.2, r: 1.9, fill: 'currentColor' }),
          h('circle', { cx: 10.2, cy: 10.8, r: 1.9, fill: 'currentColor' }));
      }
      if (name === 'back') {
        return h('svg', props, h('path', {
          d: 'M9.8 3.4 5.2 8l4.6 4.6',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }));
      }
      if (name === 'collapse') {
        return h('svg', props, h('path', {
          d: 'M3.6 6.1 8 10.5l4.4-4.4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }));
      }
      return null;
    }

    function tomato(size) {
      const side = size || 18;
      return h('svg', {
        width: side,
        height: side,
        viewBox: '0 0 64 64',
        'aria-hidden': true,
        style: { display: 'block' },
      },
        h('circle', { cx: 32, cy: 37, r: 21, fill: '#e2573f' }),
        h('ellipse', { cx: 32, cy: 21, rx: 10.5, ry: 4.4, fill: '#3f8f4a' }),
        h('path', {
          d: 'M32 21.5v-6.4',
          stroke: '#3f8f4a',
          strokeWidth: 3.4,
          strokeLinecap: 'round',
        }),
        h('circle', {
          cx: 32,
          cy: 37,
          r: 13,
          fill: 'none',
          stroke: '#ffffff',
          strokeOpacity: 0.85,
          strokeWidth: 2.4,
        }),
        h('path', {
          d: 'M32 37V30M32 37l5 3',
          stroke: '#ffffff',
          strokeWidth: 2.4,
          strokeLinecap: 'round',
        }));
    }

    /* ------------------------------------------------------------------ */
    /* Styles                                                             */
    /* ------------------------------------------------------------------ */

    const CSS = `
.pom-root{position:absolute;font-size:13px;line-height:1.45;color:var(--dsw-alias-label-primary);-webkit-tap-highlight-color:transparent}
.pom-root *{box-sizing:border-box}
.pom-pill{display:flex;align-items:center;gap:2px;padding:4px 6px 4px 4px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);box-shadow:0 6px 18px rgba(0,0,0,.18);touch-action:none;user-select:none}
[data-ds-dark-theme] .pom-pill{box-shadow:0 6px 18px rgba(0,0,0,.5)}
.pom-pill.running{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 42%,var(--dsw-alias-border-l1))}
.pom-pill.alert{border-color:var(--dsw-alias-brand-primary);animation:pom-pulse 1.1s ease-in-out infinite}
@keyframes pom-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent)}}
.pom-pillmain{display:inline-flex;align-items:center;gap:6px;padding:3px 7px;border:none;border-radius:999px;background:transparent;color:inherit;font:inherit;cursor:pointer}
.pom-pillmain:hover{background:var(--dsw-alias-bg-layer-2)}
.pom-badge{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px}
.pom-pilltime{font-variant-numeric:tabular-nums;font-weight:600;letter-spacing:.02em}
.pom-play{width:26px;height:26px;padding:0;border:none;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base));cursor:pointer;flex:none}
.pom-play:hover{filter:brightness(1.06)}
.pom-card{width:268px;padding:12px;border-radius:14px;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);box-shadow:0 10px 30px rgba(0,0,0,.18);user-select:none}
[data-ds-dark-theme] .pom-card{box-shadow:0 10px 30px rgba(0,0,0,.5)}
.pom-head{display:flex;align-items:center;gap:6px;margin-bottom:8px;cursor:grab;touch-action:none}
.pom-head:active{cursor:grabbing}
.pom-headicon{display:inline-flex;flex:none}
.pom-title{flex:1;min-width:0;font-weight:600}
.pom-round{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.pom-iconbtn{width:24px;height:24px;padding:0;border:none;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none}
.pom-iconbtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.pom-dial{position:relative;display:grid;place-items:center;margin:2px 0 10px}
.pom-dialtext{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;pointer-events:none}
.pom-time{font-size:26px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:.01em}
.pom-phase{font-size:11px;color:var(--dsw-alias-label-secondary)}
.pom-notice{margin:0 0 8px;padding:6px 9px;border-radius:8px;font-size:12px;background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l1)}
.pom-controls{display:flex;align-items:center;gap:6px}
.pom-primary{flex:1;height:32px;padding:0 12px;border:none;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base));font:inherit;font-weight:600;cursor:pointer}
.pom-primary:hover{filter:brightness(1.06)}
.pom-secondary{width:32px;height:32px;padding:0;border:.5px solid var(--dsw-alias-border-l1);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none}
.pom-secondary:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.pom-view{display:flex;flex-direction:column;gap:8px}
.pom-group{display:flex;flex-direction:column;gap:8px}
.pom-group-off{opacity:.4;pointer-events:none}
.pom-row{display:flex;align-items:center;gap:8px;min-height:30px}
.pom-label{flex:1;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pom-field{display:flex;align-items:center;gap:4px;flex:none}
.pom-step{width:24px;height:24px;padding:0;border:.5px solid var(--dsw-alias-border-l1);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:1;cursor:pointer}
.pom-step:hover{background:var(--dsw-alias-bg-layer-2)}
.pom-num{width:44px;height:24px;padding:0 2px;text-align:center;border:.5px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-variant-numeric:tabular-nums}
.pom-num:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.pom-num::-webkit-outer-spin-button,.pom-num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.pom-unit{min-width:24px;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.pom-select{height:26px;max-width:112px;padding:0 4px;border:.5px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px}
.pom-range{width:92px;height:18px;accent-color:var(--dsw-alias-brand-primary)}
.pom-switch{position:relative;width:36px;height:20px;padding:0;border:none;border-radius:999px;background:var(--dsw-alias-state-idle-primary);cursor:pointer;flex:none;transition:background .15s}
.pom-switch.on{background:var(--dsw-alias-brand-primary)}
.pom-knob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-base);box-shadow:0 1px 2px rgba(0,0,0,.28);transition:transform .15s}
.pom-switch.on .pom-knob{transform:translateX(16px)}
.pom-hint{font-size:11px;color:var(--dsw-alias-label-secondary);text-align:center;padding-top:2px}
`;

    /* ------------------------------------------------------------------ */
    /* Small controls                                                     */
    /* ------------------------------------------------------------------ */

    function MinuteField(props) {
      const t = props.t;
      const value = props.value;
      const min = props.min;
      const max = props.max;
      const [draft, setDraft] = React.useState(String(value));

      React.useEffect(() => {
        setDraft(String(value));
      }, [value]);

      const commit = () => {
        const parsed = Math.round(Number(draft));
        if (Number.isFinite(parsed)) {
          const next = clamp(parsed, min, max);
          props.onChange(next);
          if (next !== parsed) setDraft(String(next));
        } else {
          setDraft(String(value));
        }
      };

      return h('div', { className: 'pom-field' },
        h('button', {
          type: 'button',
          className: 'pom-step',
          'aria-label': t('decrease'),
          onClick: () => props.onChange(clamp(value - 1, min, max)),
        }, '\u2212'),
        h('input', {
          type: 'number',
          className: 'pom-num',
          inputMode: 'numeric',
          min: min,
          max: max,
          value: draft,
          onChange: (event) => setDraft(event.target.value),
          onBlur: commit,
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              commit();
              event.currentTarget.blur();
            }
          },
        }),
        h('button', {
          type: 'button',
          className: 'pom-step',
          'aria-label': t('increase'),
          onClick: () => props.onChange(clamp(value + 1, min, max)),
        }, '+'),
        h('span', { className: 'pom-unit' }, props.unit || t('minUnit')));
    }

    function Switch(props) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': props.checked,
        'aria-label': props.label,
        className: 'pom-switch' + (props.checked ? ' on' : ''),
        onClick: props.onChange,
      }, h('span', { className: 'pom-knob' }));
    }

    /* ------------------------------------------------------------------ */
    /* Widget                                                             */
    /* ------------------------------------------------------------------ */

    function PomodoroWidget(props) {
      const engine = props.engine;
      const t = props.t;
      const locale = props.locale;

      // Re-render when the active locale changes; t() reads it at call time.
      React.useSyncExternalStore(
        React.useCallback((notify) => locale.subscribe(notify), [locale]),
        React.useCallback(() => locale.getSnapshot(), [locale]),
        React.useCallback(() => locale.getSnapshot(), [locale]));

      const snapshot = React.useSyncExternalStore(
        React.useCallback((notify) => engine.subscribe(notify), [engine]),
        React.useCallback(() => engine.getSnapshot(), [engine]),
        React.useCallback(() => engine.getSnapshot(), [engine]));

      const settings = snapshot.settings;
      const [expanded, setExpanded] = React.useState(() => {
        const saved = readJSON(UI_KEY);
        return saved && typeof saved.expanded === 'boolean' ? saved.expanded : true;
      });
      const [view, setView] = React.useState('timer');
      const [position, setPosition] = React.useState(() => {
        const saved = readJSON(POS_KEY);
        return saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
          ? { x: saved.x, y: saved.y }
          : null;
      });

      const rootRef = React.useRef(null);
      const dragRef = React.useRef(null);
      const positionRef = React.useRef(position);
      const suppressClickRef = React.useRef(false);

      positionRef.current = position;

      React.useEffect(() => {
        writeJSON(UI_KEY, { expanded });
      }, [expanded]);

      React.useEffect(() => {
        const onVisibility = () => {
          if (!document.hidden) engine.sync();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
      }, [engine]);

      React.useEffect(() => {
        const clampIntoView = () => {
          const node = rootRef.current;
          const current = positionRef.current;
          if (!node || !current) return;
          const rect = node.getBoundingClientRect();
          const x = clamp(current.x, 8, Math.max(8, window.innerWidth - rect.width - 8));
          const y = clamp(current.y, 8, Math.max(8, window.innerHeight - rect.height - 8));
          if (x !== current.x || y !== current.y) setPosition({ x, y });
        };
        window.addEventListener('resize', clampIntoView);
        return () => window.removeEventListener('resize', clampIntoView);
      }, []);

      // Keep an explicitly placed card inside the viewport when it grows.
      React.useEffect(() => {
        const node = rootRef.current;
        const current = positionRef.current;
        if (!node || !current) return;
        const rect = node.getBoundingClientRect();
        const x = clamp(current.x, 8, Math.max(8, window.innerWidth - rect.width - 8));
        const y = clamp(current.y, 8, Math.max(8, window.innerHeight - rect.height - 8));
        if (x !== current.x || y !== current.y) setPosition({ x, y });
      }, [expanded, view]);

      const beginDrag = React.useCallback((event) => {
        if (typeof event.button === 'number' && event.button !== 0) return;
        const node = rootRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        dragRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          moved: false,
        };

        const onMove = (moveEvent) => {
          const drag = dragRef.current;
          if (!drag) return;
          const dx = moveEvent.clientX - drag.startX;
          const dy = moveEvent.clientY - drag.startY;
          if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
          drag.moved = true;
          const next = {
            x: clamp(drag.left + dx, 8, Math.max(8, window.innerWidth - drag.width - 8)),
            y: clamp(drag.top + dy, 8, Math.max(8, window.innerHeight - drag.height - 8)),
          };
          positionRef.current = next;
          setPosition(next);
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          const drag = dragRef.current;
          dragRef.current = null;
          if (drag && drag.moved) {
            suppressClickRef.current = true;
            writeJSON(POS_KEY, positionRef.current || { x: 0, y: 0 });
            setTimeout(() => {
              suppressClickRef.current = false;
            }, 0);
          }
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }, []);

      const consumeSuppressedClick = () => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return true;
        }
        return false;
      };

      const style = position
        ? { left: position.x + 'px', top: position.y + 'px' }
        : { right: '16px', bottom: '16px' };

      const running = snapshot.status === 'running';
      const remaining = snapshot.remaining;
      const total = Math.max(1, snapshot.total);
      const progress = clamp(remaining / total, 0, 1);
      const radius = 48;
      const circumference = 2 * Math.PI * radius;
      const dialStroke = snapshot.phase === 'work'
        ? 'var(--dsw-alias-brand-primary)'
        : 'var(--dsw-alias-state-success-primary)';

      const roundIndex = settings.longBreakEnabled
        ? (snapshot.phase === 'work'
          ? (snapshot.completed % settings.longEvery) + 1
          : Math.max(1, ((snapshot.completed - 1) % settings.longEvery) + 1))
        : Math.max(1, snapshot.phase === 'work' ? snapshot.completed + 1 : snapshot.completed);
      const roundText = settings.longBreakEnabled
        ? t('roundLabel', { i: roundIndex, n: settings.longEvery })
        : t('roundOnly', { i: roundIndex });

      const phaseText = running
        ? (snapshot.phase === 'work' ? t('statusFocus') : t('statusBreak'))
        : snapshot.status === 'paused'
          ? t('statusPaused')
          : t('statusReady');

      const primaryLabel = running ? t('pause') : snapshot.status === 'paused' ? t('resume') : t('start');

      const noticeText = snapshot.notice ? t(snapshot.notice) : '';

      const startOrPause = (event) => {
        if (event) event.stopPropagation();
        engine.toggle();
      };

      const dial = h('div', { className: 'pom-dial' },
        h('svg', { width: 112, height: 112, viewBox: '0 0 112 112', 'aria-hidden': true },
          h('circle', {
            cx: 56,
            cy: 56,
            r: radius,
            fill: 'none',
            stroke: 'var(--dsw-alias-border-l2)',
            strokeWidth: 6,
          }),
          h('circle', {
            cx: 56,
            cy: 56,
            r: radius,
            fill: 'none',
            stroke: dialStroke,
            strokeWidth: 6,
            strokeLinecap: 'round',
            strokeDasharray: circumference,
            strokeDashoffset: circumference * (1 - progress),
            transform: 'rotate(-90 56 56)',
            style: { transition: 'stroke-dashoffset .25s linear, stroke .2s linear' },
          })),
        h('div', { className: 'pom-dialtext' },
          h('div', { className: 'pom-time', 'aria-live': 'off' }, formatTime(remaining)),
          h('div', { className: 'pom-phase' }, phaseText)));

      const timerView = h('div', { className: 'pom-view' },
        noticeText ? h('div', { className: 'pom-notice', role: 'status' }, noticeText) : null,
        dial,
        h('div', { className: 'pom-controls' },
          h('button', {
            type: 'button',
            className: 'pom-primary',
            onClick: startOrPause,
            'aria-label': primaryLabel,
          }, icon(running ? 'pause' : 'play', 14), h('span', null, primaryLabel)),
          h('button', {
            type: 'button',
            className: 'pom-secondary',
            title: t('reset'),
            'aria-label': t('reset'),
            onClick: () => engine.reset(),
          }, icon('reset', 15)),
          h('button', {
            type: 'button',
            className: 'pom-secondary',
            title: t('skip'),
            'aria-label': t('skip'),
            onClick: () => engine.skip(),
          }, icon('skip', 15))));

      const settingsView = h('div', { className: 'pom-view' },
        h('div', { className: 'pom-row' },
          h('span', { className: 'pom-label' }, t('workMinutes')),
          h(MinuteField, {
            t: t,
            value: settings.work,
            min: LIMITS.work[0],
            max: LIMITS.work[1],
            onChange: (value) => engine.updateSettings({ work: value }),
          })),
        h('div', { className: 'pom-row' },
          h('span', { className: 'pom-label' }, t('shortMinutes')),
          h(MinuteField, {
            t: t,
            value: settings.short,
            min: LIMITS.short[0],
            max: LIMITS.short[1],
            onChange: (value) => engine.updateSettings({ short: value }),
          })),
        h('div', { className: 'pom-row' },
          h('span', { className: 'pom-label' }, t('longBreak')),
          h(Switch, {
            checked: settings.longBreakEnabled,
            label: t('longBreak'),
            onChange: () => engine.updateSettings({ longBreakEnabled: !settings.longBreakEnabled }),
          })),
        h('div', { className: 'pom-group' + (settings.longBreakEnabled ? '' : ' pom-group-off') },
          h('div', { className: 'pom-row' },
            h('span', { className: 'pom-label' }, t('longMinutes')),
            h(MinuteField, {
              t: t,
              value: settings.long,
              min: LIMITS.long[0],
              max: LIMITS.long[1],
              onChange: (value) => engine.updateSettings({ long: value }),
            })),
          h('div', { className: 'pom-row' },
            h('span', { className: 'pom-label' }, t('longEvery')),
            h(MinuteField, {
              t: t,
              value: settings.longEvery,
              min: LIMITS.longEvery[0],
              max: LIMITS.longEvery[1],
              unit: t('roundUnit'),
              onChange: (value) => engine.updateSettings({ longEvery: value }),
            }))),
        h('div', { className: 'pom-row' },
          h('span', { className: 'pom-label' }, t('sound')),
          h('select', {
            className: 'pom-select',
            value: settings.sound,
            onChange: (event) => {
              const sound = event.target.value;
              engine.updateSettings({ sound });
              engine.preview(sound);
            },
          }, SOUNDS.map((id) => h('option', { key: id, value: id },
            t('sound' + id.charAt(0).toUpperCase() + id.slice(1)))))),
        h('div', { className: 'pom-row' },
          h('span', { className: 'pom-label' }, t('ringFor')),
          h('select', {
            className: 'pom-select',
            value: settings.ringSeconds,
            onChange: (event) => engine.updateSettings({ ringSeconds: Number(event.target.value) }),
          }, RING_OPTIONS.map((seconds) => h('option', { key: seconds, value: seconds },
            seconds + ' ' + t('secUnit'))))),
        h('div', { className: 'pom-row' },
          h('span', { className: 'pom-label' }, t('volume')),
          h('input', {
            type: 'range',
            className: 'pom-range',
            min: 0,
            max: 100,
            step: 5,
            value: settings.volume,
            'aria-label': t('volume'),
            onChange: (event) => engine.updateSettings({ volume: Number(event.target.value) }),
            onPointerUp: () => engine.preview(settings.sound),
          }),
          h('span', { className: 'pom-unit' }, settings.volume + '%')),
        h('div', { className: 'pom-row' },
          h('span', { className: 'pom-label' }, t('autoNext')),
          h(Switch, {
            checked: settings.autoNext,
            label: t('autoNext'),
            onChange: () => engine.updateSettings({ autoNext: !settings.autoNext }),
          })));

      const header = h('div', { className: 'pom-head', onPointerDown: beginDrag, title: t('dragHint') },
        h('span', { className: 'pom-headicon' }, tomato(17)),
        h('span', { className: 'pom-title' }, t('title')),
        view === 'timer' ? h('span', { className: 'pom-round' }, roundText) : null,
        h('button', {
          type: 'button',
          className: 'pom-iconbtn',
          title: view === 'timer' ? t('settings') : t('back'),
          'aria-label': view === 'timer' ? t('settings') : t('back'),
          onClick: () => setView(view === 'timer' ? 'settings' : 'timer'),
        }, icon(view === 'timer' ? 'settings' : 'back', 15)),
        h('button', {
          type: 'button',
          className: 'pom-iconbtn',
          title: t('collapse'),
          'aria-label': t('collapse'),
          onClick: () => setExpanded(false),
        }, icon('collapse', 15)));

      const card = h('div', { className: 'pom-card' }, header, view === 'timer' ? timerView : settingsView);

      const pill = h('div', {
        className: 'pom-pill' + (snapshot.notice ? ' alert' : '') + (running ? ' running' : ''),
        onPointerDown: beginDrag,
      },
        h('button', {
          type: 'button',
          className: 'pom-pillmain',
          'aria-label': t('expand'),
          onClick: () => {
            if (consumeSuppressedClick()) return;
            setExpanded(true);
          },
        },
          h('span', { className: 'pom-badge' }, tomato(16)),
          h('span', { className: 'pom-pilltime' }, formatTime(remaining))),
        h('button', {
          type: 'button',
          className: 'pom-play',
          'aria-label': primaryLabel,
          title: primaryLabel,
          onClick: startOrPause,
        }, icon(running ? 'pause' : 'play', 14)));

      return h('div', { ref: rootRef, className: 'pom-root', style: style },
        h('style', null, CSS),
        expanded ? card : pill);
    }

    /* ------------------------------------------------------------------ */
    /* Plugin                                                             */
    /* ------------------------------------------------------------------ */

    function apply(ctx) {
      const chime = new Chime();
      const engine = new PomodoroEngine(chime);

      ctx.effect(() => () => engine.dispose(), 'pomodoro: engine');

      ctx.effect(
        () => ctx.locale.register(NS, { en: EN, zh: ZH }),
        'pomodoro: locale');

      const t = ctx.locale.bind(NS);

      ctx.effect(
        () => ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'dsh-pomodoro-dial',
          order: 30,
          inject: () => ({ engine, t, locale: ctx.locale }),
        }, PomodoroWidget)),
        'pomodoro: overlay');
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    };
  },
});
