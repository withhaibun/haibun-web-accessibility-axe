import { testWithDefaults } from '@haibun/core/build/lib/test/lib.js';
import DomainWebPage from '@haibun/domain-webpage';

import A11yAxe from './a11y-axe-stepper.js';
import { DEFAULT_DEST } from '@haibun/core/build/lib/defs.js';
import { getStepperOptionName } from '@haibun/core/build/lib/util/index.js';
import { BrowserFactory } from '@haibun/web-playwright/build/BrowserFactory.js';

import WebServerStepper from '@haibun/web-server-express';
import StorageMem from '@haibun/storage-mem/build/storage-mem.js';
import WebPlaywright from '@haibun/web-playwright';
import { readFileSync } from 'fs';

const PASSES_URI = 'http://localhost:8123/static/passes.html';
const FAILS_URI = 'http://localhost:8123/static/passes.html';

const options = {
  DEST: DEFAULT_DEST
};
const extraOptions = {
  [getStepperOptionName(WebPlaywright, 'STORAGE')]: 'StorageMem',
  [getStepperOptionName(WebPlaywright, 'HEADLESS')]: 'true'
}

afterAll(async () => {
  await BrowserFactory.closeBrowsers();
});

describe('a11y test from uri', () => {
  it('passes', async () => {
    const features = [{
      path: '/features/test.feature', content: `
serve files at /static from test
Go to the ${PASSES_URI} webpage
page is accessible accepting serious 0 and moderate 2
`}];

    const res = await testWithDefaults(features, [A11yAxe, WebServerStepper, WebPlaywright, DomainWebPage, StorageMem], { options, extraOptions });
    expect(res.ok).toBe(true);
  });
  it('fails', async () => {
    const features = [{
      path: '/features/test.feature', content: `
serve files at /static from test
Go to the ${FAILS_URI} webpage
page is accessible accepting serious 0 and moderate 0
`}];

    const res = await testWithDefaults(features, [A11yAxe, WebServerStepper, WebPlaywright, DomainWebPage, StorageMem], { options, extraOptions });
    expect(res.ok).toBe(false);
  });
});

describe('generate report', () => {
  test('generates a report from failures.json', async () => {
    StorageMem.BASE_FS = {
      'failures.json': readFileSync('./test/failures.json', 'utf-8')
    }
    const features = [{ path: '/features/test.feature', content: `extract HTML report from failures.json to /report.html\nstorage entry /report.html exists` }];
    const res = await testWithDefaults(features, [A11yAxe, WebPlaywright, DomainWebPage, StorageMem], { options, extraOptions: { ...extraOptions, [getStepperOptionName(A11yAxe, A11yAxe.STORAGE)]: 'StorageMem' } });
    expect(res.ok).toBe(true);
  })
})