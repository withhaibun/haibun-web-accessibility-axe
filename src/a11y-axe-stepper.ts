import { AStepper, TWorld, TNamed, IHasOptions, OK, TAnyFixme } from '@haibun/core/build/lib/defs.js';
import { actionNotOK, findStepper, stringOrError } from '@haibun/core/build/lib/util/index.js';
import { Page } from 'playwright';
import { evalSeverity, getAxeBrowserResult } from './lib/a11y-axe.js';
import { generateHTMLAxeReportFromBrowserResult } from './lib/report.js';
import { EExecutionMessageType, TArtifactHTML, TMessageContext } from '@haibun/core/build/lib/interfaces/logger.js';

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
        const context: TMessageContext = this.getArtifact(axeReport);
        this.getWorld().logger.info(`axe report`, context);
        return Promise.resolve(OK);
      }
      const message = `not acceptable`;
      const context: TMessageContext = this.getArtifact(axeReport);

      this.getWorld().logger.error(message, context);
      return actionNotOK(message, this.getArtifact(axeReport));
    } catch (e) {
      const { message } = { message: 'test' };
      return actionNotOK(message, { incident: EExecutionMessageType.ACTION, incidentDetails: { exception: { summary: message, details: e } } });
    }
  }

  private getArtifact(axeReport: TAnyFixme): TMessageContext {
    const html = generateHTMLAxeReportFromBrowserResult(axeReport);
    const artifact: TArtifactHTML = { artifactType: 'html', html };
    const context: TMessageContext = {
      incident: EExecutionMessageType.ACTION,
      artifact,
      incidentDetails: axeReport,
      tag: this.getWorld().tag,
    };
    return context;
  }
}

export default A11yStepper;
