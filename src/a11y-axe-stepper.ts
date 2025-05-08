import { Page } from "playwright";

import { TWorld, TNamed } from "@haibun/core/build/lib/defs.js";
import { AStepper, IHasOptions } from "@haibun/core/build/lib/astepper.js";
import { TAnyFixme } from "@haibun/core/build/lib/fixme.js";
import { TArtifactHTML } from "@haibun/core/build/lib/interfaces/logger.js";
import { stringOrError, findStepper, actionNotOK, actionOK } from "@haibun/core/build/lib/util/index.js";
import { getAxeBrowserResult, evalSeverity } from "./lib/a11y-axe.js";
import { generateHTMLAxeReportFromBrowserResult } from "./lib/report.js";

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
  async setWorld(world: TWorld, steppers: AStepper[]) {
    await super.setWorld(world, steppers);
    this.pageGetter = findStepper<TGetsPage>(steppers, 'WebPlaywright');
    this.steppers = steppers;
  }

  steps = {
    checkA11yRuntime: {
      gwta: `page is accessible accepting serious {serious} and moderate {moderate}`,
      action: async ({ serious, moderate }: TNamed) => {
        const page = await this.pageGetter?.getPage();
        if (!page) {
          return actionNotOK(`no page in runtime`);
        }
        return await this.checkA11y(page, serious!, moderate!);
      },
    },
  };
  async checkA11y(page: Page, serious: string, moderate: string) {
    try {
      const axeReport = await getAxeBrowserResult(page);
      const evaluation = evalSeverity(axeReport, {
        serious: parseInt(serious!) || 0,
        moderate: parseInt(moderate!) || 0,
      });
      if (evaluation.ok) {
        const artifact = this.getArtifact(axeReport);
        return Promise.resolve(actionOK({ artifact }));
      }
      const message = `not acceptable`;
      const artifact = this.getArtifact(axeReport);

      return actionNotOK(message, { artifact });
    } catch (e) {
      const { message } = { message: 'test' };

      return actionNotOK(message, { artifact: { artifactType: 'json', json: { exception: { summary: message, details: e } } } });
    }
  }

  private getArtifact(axeReport: TAnyFixme) {
    const html = generateHTMLAxeReportFromBrowserResult(axeReport);
    const artifact: TArtifactHTML = { artifactType: 'html', html };
    return artifact;
  }
}

export default A11yStepper;
