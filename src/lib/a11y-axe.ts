import { readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { Page } from 'playwright'
import { Spec, ElementContext, RunOptions, AxeResults } from 'axe-core';
import { fileURLToPath } from 'url';
import { ConfigOptions } from './axe-types.js';

const require = createRequire(import.meta.url);

async function getModulePath() {
  const modulePath = require.resolve('axe-core');
  return modulePath;
}
const axeLoc = await getModulePath();
const axe: string = readFileSync(axeLoc, 'utf8');

export async function getAxeBrowserResult(page: Page, html = false) {
  await injectAxe(page);
  const result = await getAxeResults(page);
  return result;
}

export function evalSeverity(axeResults: AxeResults, acceptable: { serious: number, moderate: number }) {
  const serious = axeResults.violations.filter((violation) => violation.impact === 'serious');
  const moderate = axeResults.violations.filter((violation) => violation.impact === 'moderate');

  return {
    ok: (serious.length <= acceptable.serious) && (moderate.length <= acceptable.moderate)
    , acceptable
    , found: {
      serious: serious.length
      , moderate: moderate.length
    }
  };
}

export const injectAxe = async (page: Page): Promise<void> => {
  await page.evaluate((axe: string) => window.eval(axe), axe);
}

export const configureAxe = async (page: Page, configurationOptions: ConfigOptions = {}): Promise<void> => {
  await page.evaluate(
    (configOptions: Spec) => (window as any).configure(configOptions),
    configurationOptions as Spec
  );
}

export const getAxeResults = async (page: Page, context?: ElementContext, options?: RunOptions): Promise<AxeResults> => {
  const result = await page.evaluate(([context, options]) => (window as any).axe.run(context || window.document, options)
    , [/*context,*/ options]);

  return result;
}

function dirname() {
  const __filename = fileURLToPath(import.meta.url);

  return path.dirname(__filename);
}