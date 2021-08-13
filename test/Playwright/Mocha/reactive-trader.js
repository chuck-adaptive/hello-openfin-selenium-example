/**
 * Porting of Selenium examples to PlayWright
 * 
 * The bulk comments are removing duplicate
 */
const { expect } = require('chai');
const { chromium } = require('playwright');

let allContexts,            // all context objects returned by the connection
    runtimeContext,         // placeholder for runtime context object
    pages,                  // the page objects that represent the Windows
    runtimeCDPConnection,   // the Playwright connection to OpenFin
    mainWindow,             // placeholder for main window page object
    cpuInfoWindow;          // placeholder for cpu info window page object

// 10 windows are created when we launch Reactive Trader
const INITIAL_WINDOW_COUNT = 10;

describe('Hello OpenFin', async () => {
    before(async () => {
        runtimeCDPConnection = await chromium.connectOverCDP({ endpointURL: 'http://localhost:9998/' })

        allContexts = runtimeCDPConnection.contexts()
        runtimeContext = allContexts[0];
        pages = await runtimeContext.pages();
    })

    after(async () => {
        // the last test closes the application - in the event this beats it, we close the connection
        if (runtimeCDPConnection) {
            await runtimeCDPConnection.close();
        }
    })

    it('represents a single context', () => {
        expect(allContexts.length).to.equal(1);
    })

    it('has the appropriate number of windows', async () => {
        // In this case, the HelloOpenFin app spaws 3 windows on creation and Playwright creates a page for each
        expect(pages.length).to.equal(INITIAL_WINDOW_COUNT);
    })
})