#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ensureStateDir, readJson, resolveConfig, writeJsonAtomic, sleep } from './config.js';

const config = resolveConfig();
ensureStateDir(config);

const AUTH_TOKEN = crypto.randomUUID();
const IDLE_TIMEOUT_MS = parseInt(process.env.BROWSE_IDLE_TIMEOUT || '1800000', 10);
const BROWSE_PORT = parseInt(process.env.BROWSE_PORT || '0', 10);
const MAX_BUFFER = 500;

let playwright;
try {
  playwright = await import('playwright');
} catch (err) {
  const message = [
    'Playwright is not installed for gstack-browser.',
    'Run one of:',
    '  cd browse && npm install',
    '  npm i -g gstack-browser',
    '',
    `Original error: ${err.message}`,
  ].join('\n');
  fs.writeFileSync(config.startupLog, message);
  throw new Error(message);
}

function pushBounded(list, item) {
  list.push(item);
  if (list.length > MAX_BUFFER) list.splice(0, list.length - MAX_BUFFER);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function text(data, status = 200, headers = {}) {
  return new Response(String(data), {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...headers },
  });
}

function parseArgs(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return [null, args];
  const next = args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : null;
  const stripped = args.slice(0, index).concat(args.slice(index + (next ? 2 : 1)));
  return [next, stripped];
}

function parseViewport(value) {
  const match = /^(\d{2,5})x(\d{2,5})$/i.exec(value || '');
  if (!match) throw new Error('Expected viewport as WIDTHxHEIGHT, for example 1280x720');
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  if (width < 100 || height < 100) throw new Error('Viewport is too small');
  return { width, height };
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!!rel && !rel.startsWith('..') && !path.isAbsolute(rel));
}

function resolveSafePath(input, cwd = process.cwd()) {
  const resolved = path.resolve(cwd, input);
  const allowedTempDirs = Array.from(new Set([
    path.resolve(process.env.TMPDIR || '/tmp'),
    path.resolve('/tmp'),
  ]));
  if (!isInside(resolved, cwd) && !allowedTempDirs.some((tmp) => isInside(resolved, tmp))) {
    throw new Error(`Path is outside allowed directories: ${input}`);
  }
  return resolved;
}

function resolveNavigationUrl(raw, cwd = process.cwd()) {
  if (!raw) throw new Error('Missing URL');
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('file://')) {
    const url = new URL(raw);
    const rawPath = decodeURIComponent(url.pathname);
    const absolute = path.isAbsolute(rawPath) ? rawPath : path.resolve(cwd, rawPath);
    return pathToFileURL(resolveSafePath(absolute, cwd)).href + url.search + url.hash;
  }
  if (raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('/') || raw.startsWith('~')) {
    const expanded = raw.startsWith('~/')
      ? path.join(process.env.HOME || cwd, raw.slice(2))
      : raw;
    return pathToFileURL(resolveSafePath(expanded, cwd)).href;
  }
  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(raw)) {
    return `http://${raw}`;
  }
  return `https://${raw}`;
}

class BrowserController {
  constructor() {
    this.browser = null;
    this.context = null;
    this.pages = new Map();
    this.activeTabId = 0;
    this.nextTabId = 1;
    this.refs = new Map();
    this.consoleEntries = [];
    this.networkEntries = [];
    this.dialogEntries = [];
    this.extraHeaders = {};
    this.userAgent = null;
    this.viewport = { width: 1280, height: 720 };
    this.deviceScaleFactor = 1;
  }

  async init() {
    this.browser = await playwright.chromium.launch({
      headless: true,
      chromiumSandbox: process.env.GSTACK_BROWSER_SANDBOX === '1',
      args: process.env.CI || process.env.CONTAINER ? ['--no-sandbox'] : [],
    });
    this.context = await this.browser.newContext({
      viewport: this.viewport,
      deviceScaleFactor: this.deviceScaleFactor,
      ...(this.userAgent ? { userAgent: this.userAgent } : {}),
      ...(Object.keys(this.extraHeaders).length ? { extraHTTPHeaders: this.extraHeaders } : {}),
    });
    await this.newTab();
  }

  async close() {
    try {
      await this.context?.close();
    } catch {}
    try {
      await this.browser?.close();
    } catch {}
  }

  getPage() {
    const page = this.pages.get(this.activeTabId);
    if (!page) throw new Error('No active tab');
    return page;
  }

  wirePage(page) {
    page.on('console', (msg) => {
      pushBounded(this.consoleEntries, {
        ts: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        url: page.url(),
      });
    });
    page.on('requestfinished', async (request) => {
      const response = await request.response().catch(() => null);
      pushBounded(this.networkEntries, {
        ts: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        status: response?.status() ?? null,
      });
    });
    page.on('requestfailed', (request) => {
      pushBounded(this.networkEntries, {
        ts: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        failed: request.failure()?.errorText || 'failed',
      });
    });
    page.on('dialog', async (dialog) => {
      pushBounded(this.dialogEntries, {
        ts: new Date().toISOString(),
        type: dialog.type(),
        message: dialog.message(),
        url: page.url(),
      });
      await dialog.accept().catch(() => {});
    });
  }

  async newTab(url) {
    const page = await this.context.newPage();
    this.wirePage(page);
    const id = this.nextTabId++;
    this.pages.set(id, page);
    this.activeTabId = id;
    if (url) await page.goto(resolveNavigationUrl(url, config.projectDir), { waitUntil: 'domcontentloaded' });
    return id;
  }

  switchTab(id) {
    const numeric = Number(id);
    if (!this.pages.has(numeric)) throw new Error(`No tab with id ${id}`);
    this.activeTabId = numeric;
    return this.pages.get(numeric);
  }

  async closeTab(id = this.activeTabId) {
    const numeric = Number(id);
    const page = this.pages.get(numeric);
    if (!page) throw new Error(`No tab with id ${id}`);
    await page.close();
    this.pages.delete(numeric);
    if (this.pages.size === 0) await this.newTab();
    if (this.activeTabId === numeric) this.activeTabId = Array.from(this.pages.keys())[0];
  }

  locator(selector) {
    const resolved = this.refs.get(selector) || selector;
    return this.getPage().locator(resolved).first();
  }

  async snapshot(args = []) {
    const interactiveOnly = args.includes('-i') || args.includes('--interactive');
    const compact = args.includes('-c') || args.includes('--compact');
    const page = this.getPage();
    const items = await page.evaluate((interactive) => {
      const visible = (el) => {
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return style.visibility !== 'hidden'
          && style.display !== 'none'
          && box.width > 0
          && box.height > 0;
      };
      const label = (el) => {
        const direct = el.getAttribute('aria-label')
          || el.getAttribute('alt')
          || el.getAttribute('title')
          || el.getAttribute('placeholder')
          || el.innerText
          || el.textContent
          || '';
        return direct.replace(/\s+/g, ' ').trim().slice(0, 120);
      };
      const role = (el) => el.getAttribute('role') || el.tagName.toLowerCase();
      const cssPath = (el) => {
        if (el.id) return `#${CSS.escape(el.id)}`;
        const parts = [];
        let node = el;
        while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.body) {
          let part = node.tagName.toLowerCase();
          if (node.classList.length > 0) {
            part += `.${Array.from(node.classList).slice(0, 2).map((cls) => CSS.escape(cls)).join('.')}`;
          }
          const parent = node.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter((sib) => sib.tagName === node.tagName);
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
          }
          parts.unshift(part);
          node = parent;
          if (parts.length >= 5) break;
        }
        return parts.length ? parts.join(' > ') : 'body';
      };
      const interactiveSelector = [
        'a[href]',
        'button',
        'input',
        'textarea',
        'select',
        'summary',
        '[role="button"]',
        '[role="link"]',
        '[onclick]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(',');
      const selector = interactive ? interactiveSelector : 'a[href],button,input,textarea,select,summary,[role],[onclick],[tabindex],h1,h2,h3,label';
      return Array.from(document.querySelectorAll(selector))
        .filter(visible)
        .slice(0, 200)
        .map((el) => ({
          selector: cssPath(el),
          role: role(el),
          name: label(el),
          href: el.href || '',
          value: el.value || '',
        }));
    }, interactiveOnly);

    this.refs.clear();
    const lines = [`url: ${page.url()}`, `title: ${await page.title()}`];
    items.forEach((item, index) => {
      const ref = `@e${index + 1}`;
      this.refs.set(ref, item.selector);
      const name = item.name ? ` "${item.name}"` : '';
      const extra = compact ? '' : [
        item.href ? ` href=${item.href}` : '',
        item.value ? ` value="${item.value}"` : '',
      ].join('');
      lines.push(`${ref} ${item.role}${name}${extra}`);
    });
    return lines.join('\n');
  }

  async captureState() {
    const cookies = await this.context.cookies();
    const pages = [];
    for (const [id, page] of this.pages) {
      pages.push({ id, url: page.url(), active: id === this.activeTabId });
    }
    return { cookies, pages, viewport: this.viewport, deviceScaleFactor: this.deviceScaleFactor };
  }

  async recreateContext(options = {}) {
    const state = await this.captureState();
    await this.context.close();
    this.pages.clear();
    this.refs.clear();
    this.viewport = options.viewport || this.viewport;
    this.deviceScaleFactor = options.deviceScaleFactor || this.deviceScaleFactor;
    this.context = await this.browser.newContext({
      viewport: this.viewport,
      deviceScaleFactor: this.deviceScaleFactor,
      ...(this.userAgent ? { userAgent: this.userAgent } : {}),
      ...(Object.keys(this.extraHeaders).length ? { extraHTTPHeaders: this.extraHeaders } : {}),
    });
    if (state.cookies.length) await this.context.addCookies(state.cookies);
    for (const item of state.pages) {
      const id = await this.newTab(item.url && item.url !== 'about:blank' ? item.url : undefined);
      if (item.active) this.activeTabId = id;
    }
  }
}

const browser = new BrowserController();

let server;
let lastCommandAt = Date.now();
let startedAt = null;

function resetIdleTimer() {
  lastCommandAt = Date.now();
}

async function runCommand(command, args = []) {
  command = ({ setcontent: 'load-html', 'set-content': 'load-html', setContent: 'load-html' })[command] || command;
  resetIdleTimer();
  const page = browser.getPage();

  switch (command) {
    case 'help':
      return helpText();
    case 'status':
      return JSON.stringify({
        status: 'healthy',
        pid: process.pid,
        tabs: browser.pages.size,
        activeTabId: browser.activeTabId,
        url: page.url(),
      }, null, 2);
    case 'goto':
      await page.goto(resolveNavigationUrl(args[0], config.projectDir), { waitUntil: 'domcontentloaded' });
      return page.url();
    case 'back':
      await page.goBack({ waitUntil: 'domcontentloaded' });
      return page.url();
    case 'forward':
      await page.goForward({ waitUntil: 'domcontentloaded' });
      return page.url();
    case 'reload':
      await page.reload({ waitUntil: 'domcontentloaded' });
      return page.url();
    case 'url':
      return page.url();
    case 'load-html': {
      const input = args[0];
      if (!input) throw new Error('Usage: load-html <file>');
      const file = resolveSafePath(input, config.projectDir);
      const html = fs.readFileSync(file, 'utf8');
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      return `Loaded HTML from ${file}`;
    }
    case 'text': {
      const selector = args[0];
      return selector ? await browser.locator(selector).innerText() : await page.locator('body').innerText();
    }
    case 'html': {
      const selector = args[0];
      return selector ? await browser.locator(selector).evaluate((el) => el.innerHTML) : await page.content();
    }
    case 'links':
      return JSON.stringify(await page.$$eval('a[href]', (links) => links.map((a) => ({
        text: (a.innerText || a.textContent || '').trim(),
        href: a.href,
      }))), null, 2);
    case 'forms':
      return JSON.stringify(await page.$$eval('form', (forms) => forms.map((form, index) => ({
        index,
        action: form.action,
        method: form.method,
        fields: Array.from(form.querySelectorAll('input, textarea, select')).map((field) => ({
          tag: field.tagName.toLowerCase(),
          name: field.name || '',
          type: field.type || '',
          placeholder: field.placeholder || '',
          value: field.value || '',
        })),
      }))), null, 2);
    case 'accessibility':
      if (typeof page.locator('body').ariaSnapshot === 'function') {
        return await page.locator('body').ariaSnapshot();
      }
      return await browser.snapshot(['-i']);
    case 'snapshot':
      return await browser.snapshot(args);
    case 'attrs': {
      const selector = args[0];
      if (!selector) throw new Error('Usage: attrs <selector|@ref>');
      return JSON.stringify(await browser.locator(selector).evaluate((el) => Object.fromEntries(
        Array.from(el.attributes).map((attr) => [attr.name, attr.value]),
      )), null, 2);
    }
    case 'css': {
      const [selector, prop] = args;
      if (!selector || !prop) throw new Error('Usage: css <selector|@ref> <property>');
      return await browser.locator(selector).evaluate((el, property) => getComputedStyle(el).getPropertyValue(property), prop);
    }
    case 'is': {
      const [prop, selector] = args;
      if (!prop || !selector) throw new Error('Usage: is <visible|hidden|enabled|disabled|checked|editable|focused> <selector|@ref>');
      const locator = browser.locator(selector);
      if (prop === 'visible') return String(await locator.isVisible());
      if (prop === 'hidden') return String(await locator.isHidden());
      if (prop === 'enabled') return String(await locator.isEnabled());
      if (prop === 'disabled') return String(await locator.isDisabled());
      if (prop === 'checked') return String(await locator.isChecked());
      if (prop === 'editable') return String(await locator.isEditable());
      if (prop === 'focused') return String(await locator.evaluate((el) => el === document.activeElement));
      throw new Error(`Unknown state: ${prop}`);
    }
    case 'js': {
      const expr = args.join(' ');
      if (!expr) throw new Error('Usage: js <expression>');
      const value = await page.evaluate(expr);
      return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    }
    case 'eval': {
      const file = resolveSafePath(args[0], config.projectDir);
      const code = fs.readFileSync(file, 'utf8');
      const wrapped = code.includes('await') || code.includes('return')
        ? `(async () => { ${code} })()`
        : code;
      const value = await page.evaluate(wrapped);
      return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    }
    case 'click':
      await browser.locator(args[0]).click();
      return 'clicked';
    case 'fill':
      await browser.locator(args[0]).fill(args.slice(1).join(' '));
      return 'filled';
    case 'type':
      await page.keyboard.type(args.join(' '));
      return 'typed';
    case 'press':
      await page.keyboard.press(args.join('+') || 'Enter');
      return 'pressed';
    case 'select':
      await browser.locator(args[0]).selectOption(args[1]);
      return 'selected';
    case 'hover':
      await browser.locator(args[0]).hover();
      return 'hovered';
    case 'scroll':
      if (args[0]) await browser.locator(args[0]).scrollIntoViewIfNeeded();
      else await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      return 'scrolled';
    case 'wait':
      if (args[0] === '--networkidle') await page.waitForLoadState('networkidle');
      else if (args[0] === '--load') await page.waitForLoadState('load');
      else await page.locator(args[0]).waitFor({ timeout: 15000 });
      return 'ready';
    case 'viewport': {
      const [scaleValue, withoutScale] = parseArgs(args, '--scale');
      const viewportArg = withoutScale.find((arg) => /^\d+x\d+$/i.test(arg));
      const viewport = viewportArg ? parseViewport(viewportArg) : browser.viewport;
      const deviceScaleFactor = scaleValue ? Math.max(1, Math.min(3, Number(scaleValue))) : browser.deviceScaleFactor;
      if (deviceScaleFactor !== browser.deviceScaleFactor) await browser.recreateContext({ viewport, deviceScaleFactor });
      else {
        browser.viewport = viewport;
        await page.setViewportSize(viewport);
      }
      return `${viewport.width}x${viewport.height} scale=${deviceScaleFactor}`;
    }
    case 'screenshot':
      return await screenshot(args);
    case 'responsive':
      return await responsive(args[0] || 'responsive');
    case 'pdf': {
      const output = path.resolve(config.projectDir, args[0] || `page-${Date.now()}.pdf`);
      await page.pdf({ path: output, printBackground: args.includes('--print-background') });
      return output;
    }
    case 'console': {
      if (args.includes('--clear')) {
        browser.consoleEntries = [];
        return 'cleared';
      }
      const entries = args.includes('--errors')
        ? browser.consoleEntries.filter((entry) => ['error', 'warning'].includes(entry.type))
        : browser.consoleEntries;
      return entries.map((entry) => `[${entry.type}] ${entry.text}`).join('\n') || '(empty)';
    }
    case 'network':
      if (args.includes('--clear')) {
        browser.networkEntries = [];
        return 'cleared';
      }
      return browser.networkEntries.map((entry) => {
        const status = entry.failed ? `FAILED ${entry.failed}` : entry.status;
        return `${entry.method} ${status} ${entry.url}`;
      }).join('\n') || '(empty)';
    case 'dialog':
      if (args.includes('--clear')) {
        browser.dialogEntries = [];
        return 'cleared';
      }
      return browser.dialogEntries.map((entry) => `[${entry.type}] ${entry.message}`).join('\n') || '(empty)';
    case 'cookies':
      return JSON.stringify(await browser.context.cookies(), null, 2);
    case 'cookie': {
      const [name, ...valueParts] = (args[0] || '').split('=');
      if (!name || valueParts.length === 0) throw new Error('Usage: cookie name=value');
      const url = new URL(page.url());
      await browser.context.addCookies([{ name, value: valueParts.join('='), domain: url.hostname, path: '/' }]);
      return `cookie set: ${name}`;
    }
    case 'cookie-import': {
      const file = resolveSafePath(args[0], config.projectDir);
      const cookies = JSON.parse(fs.readFileSync(file, 'utf8'));
      await browser.context.addCookies(Array.isArray(cookies) ? cookies : cookies.cookies);
      return 'cookies imported';
    }
    case 'cookie-import-browser':
      throw new Error('cookie-import-browser is not included in gstack-browser lite. Use cookie-import with a JSON file.');
    case 'storage':
      if (args[0] === 'set') {
        await page.evaluate(([key, value]) => localStorage.setItem(key, value), [args[1], args.slice(2).join(' ')]);
        return 'storage set';
      }
      return JSON.stringify(await page.evaluate(() => ({
        localStorage: Object.fromEntries(Object.entries(localStorage)),
        sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
      })), null, 2);
    case 'perf':
      return JSON.stringify(await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.toJSON?.() || performance.timing), null, 2);
    case 'header': {
      const header = args.join(' ');
      const colon = header.indexOf(':');
      if (colon === -1) throw new Error('Usage: header Name: value');
      browser.extraHeaders[header.slice(0, colon).trim()] = header.slice(colon + 1).trim();
      await browser.context.setExtraHTTPHeaders(browser.extraHeaders);
      return 'header set';
    }
    case 'useragent':
      browser.userAgent = args.join(' ');
      await browser.recreateContext();
      return 'user agent set';
    case 'tabs':
      return Array.from(browser.pages.entries()).map(([id, tab]) => `${id === browser.activeTabId ? '*' : ' '} ${id} ${tab.url()}`).join('\n');
    case 'tab':
      browser.switchTab(args[0]);
      return `active tab: ${browser.activeTabId}`;
    case 'newtab': {
      const id = await browser.newTab(args[0]);
      if (args.includes('--json')) return JSON.stringify({ tabId: id, url: browser.getPage().url() }, null, 2);
      return `new tab: ${id}`;
    }
    case 'closetab':
      await browser.closeTab(args[0] || browser.activeTabId);
      return `active tab: ${browser.activeTabId}`;
    case 'state':
      return await handleState(args);
    case 'chain':
      return await handleChain(args);
    case 'stop':
      setTimeout(() => shutdown(0), 25);
      return 'stopping';
    case 'restart':
      setTimeout(() => shutdown(0), 25);
      return 'stopping; run the command again to restart';
    case 'connect':
    case 'disconnect':
    case 'focus':
    case 'handoff':
    case 'resume':
    case 'watch':
    case 'inbox':
      throw new Error(`${command} is not included in gstack-browser lite.`);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function screenshot(args) {
  const page = browser.getPage();
  const base64 = args.includes('--base64');
  const viewportOnly = args.includes('--viewport');
  let selector;
  [selector, args] = parseArgs(args, '--selector');
  const output = args.find((arg) => !arg.startsWith('--') && arg !== selector);
  const targetPath = output ? path.resolve(config.projectDir, output) : path.join(config.stateDir, `screenshot-${Date.now()}.png`);
  const options = { fullPage: !viewportOnly };
  let buffer;
  if (selector) buffer = await browser.locator(selector).screenshot();
  else buffer = await page.screenshot(options);
  if (base64) return `data:image/png;base64,${buffer.toString('base64')}`;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, buffer);
  return targetPath;
}

async function responsive(prefix) {
  const sizes = [
    ['mobile', { width: 375, height: 812 }],
    ['tablet', { width: 768, height: 1024 }],
    ['desktop', { width: 1280, height: 720 }],
  ];
  const page = browser.getPage();
  const outputs = [];
  for (const [label, viewport] of sizes) {
    await page.setViewportSize(viewport);
    const file = path.resolve(config.projectDir, `${prefix}-${label}.png`);
    await page.screenshot({ path: file, fullPage: true });
    outputs.push(file);
  }
  return outputs.join('\n');
}

async function handleState(args) {
  const action = args[0];
  const name = args[1] || 'default';
  fs.mkdirSync(config.statesDir, { recursive: true, mode: 0o700 });
  const file = path.join(config.statesDir, `${name}.json`);
  if (action === 'save') {
    writeJsonAtomic(file, await browser.captureState());
    return `State saved: ${file}`;
  }
  if (action === 'load') {
    const state = readJson(file);
    if (!state) throw new Error(`State not found: ${name}`);
    await browser.context.addCookies(state.cookies || []);
    for (const item of state.pages || []) {
      if (item.url && item.url !== 'about:blank') await browser.newTab(item.url);
    }
    return `State loaded: ${file}`;
  }
  throw new Error('Usage: state save|load <name>');
}

async function handleChain(args) {
  const raw = args.join(' ');
  const commands = JSON.parse(raw || '[]');
  if (!Array.isArray(commands)) throw new Error('chain expects JSON array');
  const results = [];
  for (const item of commands) {
    const [command, ...commandArgs] = item;
    try {
      if (command === 'stop' || command === 'restart') {
        throw new Error(`${command} cannot run inside chain; run it as a separate command`);
      }
      results.push({ command, status: 200, result: await runCommand(command, commandArgs) });
    } catch (err) {
      results.push({ command, status: 500, error: err.message });
    }
  }
  return JSON.stringify(results, null, 2);
}

function helpText() {
  return `gstack-browser commands:
  goto <url>              navigate
  snapshot [-i]           list visible elements with @e refs
  click|fill|hover <ref>  interact with @e refs or CSS selectors
  text|html|links|forms   inspect page content
  screenshot [path]       save a screenshot
  responsive [prefix]     save mobile/tablet/desktop screenshots
  console|network         inspect captured logs
  tabs|newtab|tab|closetab
  status|stop|restart`;
}

function validateAuth(req) {
  return req.headers.get('authorization') === `Bearer ${AUTH_TOKEN}`;
}

async function readRequestJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

async function fetchHandler(req) {
  const url = new URL(req.url);
  if (url.pathname === '/health') {
    return json({
      status: 'healthy',
      pid: process.pid,
      startedAt,
      tabs: browser.pages.size,
      activeTabId: browser.activeTabId,
      url: browser.getPage().url(),
    });
  }

  if (url.pathname !== '/command') return text('Not found', 404);
  if (!validateAuth(req)) return json({ error: 'Unauthorized' }, 401);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await readRequestJson(req);
  if (!body?.command) return json({ error: 'Missing command' }, 400);
  try {
    const result = await runCommand(body.command, body.args || []);
    return text(result);
  } catch (err) {
    return json({ error: err.message || String(err) }, 500);
  }
}

function createServer(handler) {
  return http.createServer(async (req, res) => {
    const requestUrl = `http://${req.headers.host || '127.0.0.1'}${req.url}`;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(requestUrl, {
      method: req.method,
      headers: req.headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    });
    const response = await handler(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function shutdown(code = 0) {
  try {
    fs.unlinkSync(config.stateFile);
  } catch {}
  try {
    await browser.close();
  } catch {}
  if (server) {
    server.close(() => process.exit(code));
    setTimeout(() => process.exit(code), 1000).unref();
  } else {
    process.exit(code);
  }
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
process.on('uncaughtException', (err) => {
  fs.writeFileSync(config.startupLog, err.stack || String(err));
  shutdown(1);
});
process.on('unhandledRejection', (err) => {
  fs.writeFileSync(config.startupLog, err?.stack || String(err));
  shutdown(1);
});

async function main() {
  await browser.init();
  startedAt = new Date().toISOString();
  server = createServer(fetchHandler);
  const port = await listen(server, BROWSE_PORT || 0);
  writeJsonAtomic(config.stateFile, {
    pid: process.pid,
    port,
    token: AUTH_TOKEN,
    startedAt,
    mode: 'headless',
  });
  try {
    fs.unlinkSync(config.startupLog);
  } catch {}

  setInterval(() => {
    if (Date.now() - lastCommandAt > IDLE_TIMEOUT_MS) {
      console.log('[gstack-browser] idle timeout, shutting down');
      shutdown(0);
    }
  }, 30000).unref();

  console.log(`[gstack-browser] server running on 127.0.0.1:${port}`);
}

main().catch((err) => {
  const message = err?.stack || err?.message || String(err);
  fs.writeFileSync(config.startupLog, message);
  console.error(message);
  process.exit(1);
});
