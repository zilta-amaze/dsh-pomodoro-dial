# Publishing `dsh-pomodoro-dial`

Everything that can be prepared offline is done. The steps below need **your** GitHub and npm accounts — this machine has neither `gh` nor an npm login, so it cannot create the repository, push, or publish for you.

> Target: the [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) catalogue, which powers the [dsh-market](https://github.com/dsh-market/dsh-market) plugin market. One YAML file per plugin, one PR.

---

## 0 · Repository name — done

`OWNER` has been replaced with `zilta-amaze` everywhere (`package.json`, `LICENSE`, `README.md`, the entry file), and the repository exists:

- <https://github.com/zilta-amaze/dsh-pomodoro-dial> (public, `main`)

## 1 · Create the repository and push

```sh
git config user.name  "<your name>"
git config user.email "<your email>"
git add -A
git commit -m "dsh-pomodoro-dial 1.0.0"
```

Create a **public** repo named `dsh-pomodoro-dial` on GitHub (no README, no licence file — this tree already has them), then:

```sh
git remote add origin git@github.com:<your-github-name>/dsh-pomodoro-dial.git
git push -u origin main
```

## 2 · Add the `dsh-plugin` topic

Repo page → **About** (gear) → **Topics** → `dsh-plugin`. The catalogue's CI requires it.

## 3 · Wait one day

The submission gate rejects repositories younger than **1 day**. There is no other waiting period — nothing else about this package needs to age.

## 4 · Submit to the catalogue

1. Fork [`awesome-dsh-plugin/awesome-dsh-plugin`](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin).
2. Add exactly one file, named after your repo:

   ```
   data/plugins/<your-github-name>__dsh-pomodoro-dial.yml
   ```

   Its contents are already written in [`market/dsh-pomodoro-dial.yml`](market/dsh-pomodoro-dial.yml).
3. Open a PR. Title: `Add dsh-pomodoro-dial`. Body: [`market/PR-body.md`](market/PR-body.md).

Rules that will be checked:

- **one PR ≤ 3 entries**, and only your own entry file is touched — never the generated READMEs;
- `description.en` is required and must be **accurate** (it is read as a claim and checked against the code);
- a `: ` inside a description must be quoted — the file in `market/` already is.

CI runs in this order: entry count → `dsh.bundle` present in your `package.json` → repository age → `awesome-lint` + site build. Failures name exactly what to change; push the fix to the same branch.

## 5 · npm (optional)

Listing works without npm; publishing only adds download counts and sorting.

```sh
npm login
npm publish --access public
```

- The name `dsh-pomodoro-dial` is currently free on npm (checked 2026-11-04).
- The published `package.json` must keep `repository` pointing at the listed repo (step 0 handled it).
- **Do not** add an `npm:` key to the entry YAML — the mapping is picked up from the registry automatically, and a hand-written one is rejected.

## 6 · Screenshots (optional, recommended)

Add a `screenshots.json` next to `package.json` with 1–8 paths relative to it (no leading `/`, no `..`), e.g.:

```json
["assets/shot-1.png", "assets/shot-2.png"]
```

Push them to your own repo whenever you want to change them — no PR here, the next nightly build picks them up. For the market **tile** the entry's `icon:` field must be a **GitHub-hosted raster** (`png`/`jpg`/`webp`); the `icon.svg` in this package is for the Harness plugin manager and is not accepted there.

## 7 · Second market (optional)

[dshmarketplace.dev/submit](https://dshmarketplace.dev/submit) runs a separate catalogue (`GET /api/v1/plugins`) that only lists plugins which installed cleanly in a throwaway sandbox. Submitting there is independent of the PR above.

## Updating later

Bump `version`, publish to npm if you use it, and push to the repo. Your catalogue entry links the repo, so it does not need editing. To change the description or category, edit **your own** entry file and open a small PR.
