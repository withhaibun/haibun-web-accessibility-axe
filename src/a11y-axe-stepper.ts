import { Page } from "playwright";

import { TWorld, TNamed, TFeatureStep } from "@haibun/core/build/lib/defs.js";
import { AStepper, IHasOptions } from "@haibun/core/build/lib/astepper.js";
import { TAnyFixme } from "@haibun/core/build/lib/fixme.js";
import { TArtifactHTML } from "@haibun/core/build/lib/interfaces/logger.js";
import { stringOrError, findStepper, actionNotOK, actionOK, findStepperFromOption } from "@haibun/core/build/lib/util/index.js";
import { getAxeBrowserResult, evalSeverity } from "./lib/a11y-axe.js";
import { generateHTMLAxeReportFromBrowserResult } from "./lib/report.js";
import { AStorage } from "@haibun/domain-storage/build/AStorage.js";
import { EMediaTypes } from "@haibun/domain-storage/build/media-types.js";
import { resolve } from "path";

type TGetsPage = { getPage: () => Promise<Page> };

class A11yStepper extends AStepper implements IHasOptions {
  static STORAGE = 'STORAGE';
  options = {
    [A11yStepper.STORAGE]: {
      desc: 'Storage for results',
      parse: (input: string) => stringOrError(input),
    },
  };
  pageGetter?: TGetsPage;
  steppers: AStepper[] = [];
  storage?: AStorage;
  async setWorld(world: TWorld, steppers: AStepper[]) {
    await super.setWorld(world, steppers);
    this.pageGetter = findStepper<TGetsPage>(steppers, 'WebPlaywright');
    this.steppers = steppers;
    this.storage = findStepperFromOption(steppers, this, world.moduleOptions, A11yStepper.STORAGE);

  }

  steps = {
    checkA11yRuntime: {
      gwta: `page is accessible accepting serious {serious} and moderate {moderate}`,
      action: async ({ serious, moderate }: TNamed, { seq }: TFeatureStep) => {
        const page = await this.pageGetter?.getPage();
        if (!page) {
          return actionNotOK(`no page in runtime`);
        }
        return await this.checkA11y(page, serious!, moderate!, `a11y-check-${seq}`);
      },
    },
  };
  async checkA11y(page: Page, serious: string, moderate: string, filename: string) {
    try {
      const axeReport = await getAxeBrowserResult(page);
      const evaluation = evalSeverity(axeReport, {
        serious: parseInt(serious!) || 0,
        moderate: parseInt(moderate!) || 0,
      });
      if (evaluation.ok) {
        const artifact = await this.getArtifact(axeReport, filename);
        return Promise.resolve(actionOK({ artifact }));
      }
      const message = `not acceptable`;
      const artifact = await this.getArtifact(axeReport, filename);

      return actionNotOK(message, { artifact });
    } catch (e) {
      console.error(e);
      const { message } = { message: 'test' };
      return actionNotOK(message, { artifact: { artifactType: 'json', json: { exception: { summary: message, details: e } } } });
    }
  }

  private async getArtifact(axeReport: TAnyFixme, filename: string) {
    const html = generateHTMLAxeReportFromBrowserResult(axeReport);
    if (this.storage) {
      const loc = { ...this.getWorld(), mediaType: EMediaTypes.html };
      const dir = await this.storage.ensureCaptureLocation(loc, '');
      const path = resolve(dir, filename + '.html');
      await this.storage.writeFile(path, html, EMediaTypes.html);
      const artifact: TArtifactHTML = { artifactType: 'html', path };
      return artifact;
    }
    this.getWorld().logger?.warn(`no storage defined, including report inline`);
    const artifact: TArtifactHTML = { artifactType: 'html', html };
    return artifact;
  }
}

export default A11yStepper;
