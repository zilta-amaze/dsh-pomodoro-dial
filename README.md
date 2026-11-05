# dsh-pomodoro-dial

A Pomodoro timer for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI. It lives in the bottom-right corner of the app as a small floating dial, so a focus session stays visible while you work in the conversation.

![icon](icon.svg)

## Features

- **Lengths you set yourself** — focus, short break and long break each take any value from 1 minute up, with a stepper and a directly editable field.
- **Round tracking** — every *N* completed focus rounds (default 4) the break becomes a long break; the counter is shown in the card header.
- **Long break can be switched off** — with the switch off, every round is followed by the short break and the counter simply counts up.
- **Five alarm sounds, all synthesized** — bell, chime, wood block, beep and rising bell, built with the Web Audio API. No audio files, so the plugin works offline and adds no assets. Pick one and it previews immediately; silent is an option too.
- **Ring duration and volume** — how long the alarm keeps ringing (5–60 s) and how loud it is, both adjustable.
- **Auto-start next phase** — optional; off means the next phase waits for you.
- **Collapse, drag, remember** — the card collapses to a `24:59` pill (with play/pause on it), can be dragged anywhere and stays there. Timer state and settings survive a page reload.
- **Bilingual and themed** — English and Chinese follow the Harness locale; every colour comes from `--dsw-alias-*` theme tokens, so light and dark themes both match the host.

## Install

```sh
dsh plugin --profile web add github:zilta-amaze/dsh-pomodoro-dial
```

or, once published to npm:

```sh
dsh plugin --profile web add dsh-pomodoro-dial
```

Reload the Harness page after installing — the client half is part of the page bundle.

## Usage

- The widget appears at the bottom-right on first load (expanded once). Collapse it with the chevron; after that it stays a pill until you click it.
- `▶` on the pill, or **Start** in the card, begins the focus phase.
- The gear opens the settings page: lengths, long-break switch and interval, sound, ring duration, volume, auto-start.
- Drag the title bar (or the pill) to move the widget; the position is saved.

## How it works

The package is one cordis bundle row plus a Client module:

- `index.js` — the Host half, intentionally empty: the timer is entirely a Client feature.
- `client.js` — registers a localized component in the `shell.overlay` slot (`dsh-pomodoro-dial`), owns the timer engine, and renders with `React.createElement`.
- `cordis.patch.yml` — the bundle patch that inserts the row.

The engine runs outside React, publishes a snapshot through `useSyncExternalStore`, and keeps its state in `localStorage` under `dsh-pomodoro-dial:*`. **It makes no network requests and collects nothing.** The only browser APIs used are `localStorage` and `AudioContext`.

## Compatibility

Requires a Harness build whose Client exposes the `shell.overlay` slot and the `locale` service (`@deepseek-ai/dsh-client-ui-layout`, `@deepseek-ai/dsh-client-locale`). No runtime dependencies, no build step.

## License

MIT — see [LICENSE](LICENSE).

---

# 中文说明

# dsh-pomodoro-dial（番茄钟）

给 DeepSeek Harness Web 界面用的番茄钟：常驻右下角的一个小圆盘，专注时随时能看到剩余时间。

## 功能

- **时长全自定义**：专注、短休、长休都能改，步进按钮 + 可直接输入的分钟框。
- **轮次**：每完成 N 轮专注（默认 4 轮）进入一次长休，卡片顶部显示「第 2 / 4 轮」。
- **长休可关闭**：关掉开关后每轮结束都走短休，轮次改成正序计数。
- **五种闹铃，全部实时合成**：清脆铃、三音铃、木质敲击、电子滴答、渐强钟声，用 Web Audio 合成，不依赖任何音频文件，离线可用。选中即试听，也可以选静音。
- **响铃时长与音量**：响多久（5–60 秒）、多大声都能调。
- **自动开始下一段**：可选，关掉后每段结束会停下来等你。
- **收起、拖动、记得住**：卡片可收成一个显示 `24:59` 的小胶囊（胶囊上就能播放/暂停），可拖到任意位置并记住；计时与设置刷新后继续。
- **双语 + 跟随主题**：中英文随界面语言切换，颜色全部取自 `--dsw-alias-*` 主题变量，明暗主题都跟宿主一致。

## 安装

```sh
dsh plugin --profile web add github:zilta-amaze/dsh-pomodoro-dial
```

装完重新加载一次 Harness 页面（客户端模块属于页面包）。

## 使用

- 首次加载会在右下角展开一次，点箭头收起后就是一个胶囊，点它展开。
- 胶囊上的 `▶` 或卡片里的「开始」开始专注。
- 齿轮进入设置：时长、长休开关与间隔、音效、响铃时长、音量、自动开始。
- 拖标题栏（或胶囊）移动位置，会被记住。

## 实现

一个 cordis bundle 行 + 一个客户端模块：`index.js` 是空的宿主半边，`client.js` 在 `shell.overlay` 里注册一个本地化组件并自带计时引擎；引擎在 React 之外运行，通过 `useSyncExternalStore` 发布快照，状态存在 `localStorage` 的 `dsh-pomodoro-dial:*` 下。**不发起任何网络请求，不收集任何信息**，只用 `localStorage` 和 `AudioContext`。

## 许可

MIT。
