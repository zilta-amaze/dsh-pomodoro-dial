// Package checks for dsh-pomodoro-dial, run by .github/workflows/ci.yml.
//
// Everything here is dependency-free on purpose: the plugin has no build step
// and no node_modules, so CI should not need one either. Each check guards a
// failure mode that the marketplace's own tooling cannot see (it reads only the
// catalogue entry) or that would only surface for a user after install.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const ok = [];
const fail = (msg) => errors.push(msg);
const pass = (msg) => ok.push(msg);

const read = (p) => readFileSync(join(root, p), 'utf8');
const exists = (p) => existsSync(join(root, p));

// ---------------------------------------------------------------- manifest
let pkg;
try {
  pkg = JSON.parse(read('package.json'));
  pass('package.json parses');
} catch (e) {
  fail(`package.json is not valid JSON: ${e.message}`);
  report();
}

const name = pkg.name;
if (!name) fail('package.json has no name');
if (!pkg.version) fail('package.json has no version');
else if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(pkg.version)) fail(`version "${pkg.version}" is not semver`);
if (!pkg.license) fail('package.json has no license');
if (pkg.private) fail('package.json is private — a marketplace-installable plugin must not be');
if (!pkg.description) fail('package.json has no description');

// dsh.bundle / dsh.client: the two halves the loader needs.
const bundlePatch = pkg.dsh?.bundle?.patch;
if (!bundlePatch) fail('package.json has no dsh.bundle.patch');
else if (!exists(bundlePatch)) fail(`dsh.bundle.patch points at a missing file: ${bundlePatch}`);
if (pkg.dsh?.client?.platform !== 'web') fail('dsh.client.platform must be "web"');
if (!Array.isArray(pkg.dsh?.client?.inject)) fail('dsh.client.inject must be an array');

// exports: the loader resolves these names, not raw paths.
for (const key of ['.', './client', './locale/*.json']) {
  const target = pkg.exports?.[key];
  if (!target) fail(`package.json exports is missing "${key}"`);
  // Wildcard subpaths ("./locale/*.json") are resolved per file by the loader,
  // so there is no single path to stat; the locale loop below covers them.
  else if (!target.includes('*') && !exists(target)) fail(`exports["${key}"] points at a missing file: ${target}`);
}
if (!exists('icon.svg')) fail('icon.svg is missing (the loader uses it as artwork)');

// `files` drives npm pack; anything missing there ships a broken package.
if (!Array.isArray(pkg.files) || pkg.files.length === 0) fail('package.json has no files list');
else {
  for (const f of pkg.files) {
    if (f.includes('*')) continue;
    if (!exists(f)) fail(`files entry does not exist: ${f}`);
  }
  if (!pkg.files.includes('client.js')) fail('files is missing client.js');
  if (!pkg.files.includes('README.md')) fail('files is missing README.md');
}

// ---------------------------------------------------------------- client half
const client = read('client.js');
const loaderId = client.match(/__ModuleLoader__\.load\(\s*\{\s*id:\s*'([^']+)'/)?.[1];
if (!loaderId) fail('client.js does not call __ModuleLoader__.load({ id: ... })');
else if (loaderId !== name) fail(`client.js registers as "${loaderId}" but the package is "${name}"`);

// The slot id and locale namespace must follow the package name too, otherwise
// two installs of the same plugin collide or the catalogue shows the wrong text.
if (loaderId && !client.includes(`'${name}'`)) fail('client.js never mentions the package name outside the loader call');

// ---------------------------------------------------------------- locales
const locales = {};
for (const lang of ['en', 'zh']) {
  const p = `locale/${lang}.json`;
  if (!exists(p)) { fail(`${p} is missing`); continue; }
  try {
    locales[lang] = JSON.parse(read(p));
    pass(`${p} parses`);
  } catch (e) {
    fail(`${p} is not valid JSON: ${e.message}`);
  }
  if (locales[lang] && !locales[lang].meta?.title) fail(`${p} has no meta.title`);
}

const flatKeys = (o, prefix = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
if (locales.en && locales.zh) {
  const en = flatKeys(locales.en).sort().join(',');
  const zh = flatKeys(locales.zh).sort().join(',');
  if (en !== zh) fail(`locale key sets differ:\n    en: ${en}\n    zh: ${zh}`);
  else pass('locale keys match across en/zh');
}

// ---------------------------------------------------------------- host patch
if (bundlePatch && exists(bundlePatch)) {
  const patch = read(bundlePatch);
  if (!/^\s*-\s*insert:/m.test(patch)) fail(`${bundlePatch} has no "- insert:" row`);
  if (!patch.includes(`name: ${name}`)) fail(`${bundlePatch} never references the package name "${name}"`);
  else pass(`${bundlePatch} inserts "${name}"`);
}

// ---------------------------------------------------------------- entry file
// market/dsh-pomodoro-dial.yml is the catalogue entry. It is not shipped in the
// tarball, but a stale one is what a maintainer would merge, so check it here.
const entryPath = `market/${name}.yml`;
if (exists(entryPath)) {
  const entry = read(entryPath);
  const url = entry.match(/^url:\s*(\S+)\s*$/m)?.[1];
  const entryName = entry.match(/^name:\s*(\S+)\s*$/m)?.[1];
  const expected = pkg.repository?.url?.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!url) fail(`${entryPath} has no url:`);
  else if (expected && url !== `https://github.com/${expected[1]}/${expected[2]}`) {
    fail(`${entryPath} url (${url}) does not match repository.url`);
  }
  if (entryName && url && entryName !== url.replace(/^https:\/\/github\.com\//, '')) {
    fail(`${entryPath} name (${entryName}) does not match its url`);
  }
  pass(`${entryPath} is consistent`);
}

// ---------------------------------------------------------------- placeholders
for (const p of ['package.json', 'README.md', 'LICENSE', bundlePatch ?? 'cordis.patch.yml'].filter(Boolean)) {
  if (exists(p) && read(p).includes('OWNER')) fail(`${p} still contains the OWNER placeholder`);
}

// ---------------------------------------------------------------- smoke test
// Load the client half the way the Web UI does and check that apply() wires up
// the slot + locale, and that the timer starts at the documented default. This
// catches a rename or a syntax error that node --check alone would not.
try {
  let captured = null;
  const store = new Map();
  globalThis.window = {
    __ModuleLoader__: { load: (entry) => { captured = entry; } },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  };
  new Function('window', client)(globalThis.window);
  if (!captured) throw new Error('loader never called');
  if (captured.id !== name) throw new Error(`loader id "${captured.id}" !== "${name}"`);

  const registered = [];
  let localeNs = null;
  const dicts = {};
  const locale = {
    register: (ns, d) => { localeNs = ns; Object.assign(dicts, d); return () => {}; },
    bind: (ns) => (k, p) => {
      const table = dicts.zh ?? dicts.en ?? {};
      return (table[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => (p && n in p ? String(p[n]) : `{${n}}`));
    },
    getSnapshot: () => ({ active: 'zh', locales: [], revision: 1 }),
    subscribe: () => () => {},
  };
  const ctx = {
    effect: (fn) => { fn(); return () => {}; },
    locale,
    slots: {
      inject: (key, cb) => { cb(); return () => {}; },
      register: (o) => { registered.push(o); return () => {}; },
    },
  };

  const React = {
    createElement: () => null,
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useRef: (v) => ({ current: v }),
    useCallback: (f) => f,
    useMemo: (f) => f(),
    useEffect: () => {},
    useLayoutEffect: () => {},
  };
  const mod = captured.factory((spec) => (spec === 'react' ? React : null));
  if (typeof mod.apply !== 'function') throw new Error('module has no apply()');
  mod.apply(ctx);

  if (localeNs !== name) throw new Error(`locale namespace "${localeNs}" !== "${name}"`);
  const entry = registered.find((r) => r.name === 'shell.overlay');
  if (!entry) throw new Error('never registered into shell.overlay');
  if (entry.id !== name) throw new Error(`slot id "${entry.id}" !== "${name}"`);
  const props = entry.inject ? entry.inject() : {};
  if (!props.engine) throw new Error('slot inject() exposes no engine');
  const snap = props.engine.getSnapshot();
  if (snap.remaining !== 25 * 60 * 1000) throw new Error(`default focus is ${snap.remaining}ms, expected 25min`);
  pass(`smoke test: ${name} registers shell.overlay + locale, default focus 25min`);
} catch (e) {
  fail(`smoke test failed: ${e.message}`);
}

report();

function report() {
  for (const line of ok) console.log(`  ok   ${line}`);
  if (errors.length === 0) {
    console.log(`\n${ok.length} checks passed`);
    process.exit(0);
  }
  for (const line of errors) console.error(`  FAIL ${line}`);
  console.error(`\n${errors.length} check(s) failed`);
  process.exit(1);
}
