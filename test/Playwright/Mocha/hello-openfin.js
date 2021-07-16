/**
 * Porting of Selenium examples to PlayWright
 */
const { expect } = require('chai');
const { chromium } = require('playwright');

let allContexts,            // all context objects returned by the connection
    runtimeContext,         // placeholder for runtime context object
    pages,                  // the page objects that represent the Windows
    runtimeCDPConnection,   // the Playwright connection to OpenFin
    mainWindow,             // placeholder for main window page object
    cpuInfoWindow;          // placeholder for cpu info window page object

/**
 * As demonstrated, you can execute arbitrary code that utilizes the OpenFin API in a window context.
 * This is a valid strategy for retrieving a Window identity, worth pointing out but
 * not what I do in this POC. Here, I map an internal collection of names to their URLs.
 * The URL is made available on Playwright's Page class
 */
const urlNameMap = {
    main: 'http://demoappdirectory.openf.in/desktop/config/apps/OpenFin/HelloOpenFin/index.html',
    cpuInfo: 'http://demoappdirectory.openf.in/desktop/config/apps/OpenFin/HelloOpenFin/views/cpu.html',
    interApp: 'http://demoappdirectory.openf.in/desktop/config/apps/OpenFin/HelloOpenFin/views/interappbus.html',
    notification: 'http://demoappdirectory.openf.in/desktop/config/apps/OpenFin/HelloOpenFin/views/notification.html'
}

const INITIAL_WINDOW_COUNT = 3;

function getWindowByName(name, pages) {
    const page = pages.filter(page => page.url() === urlNameMap[name])[0]

    return page
}

describe('Hello OpenFin', async () => {
    before(async () => {
        // Port matches the HelloOpenFin app.json devtools_port - http://demoappdirectory.openf.in/desktop/config/apps/OpenFin/HelloOpenFin/app.json
        runtimeCDPConnection = await chromium.connectOverCDP({ endpointURL: 'http://localhost:9090/' })

        allContexts = runtimeCDPConnection.contexts()
        runtimeContext = allContexts[0];
        pages = await runtimeContext.pages();

        mainWindow = getWindowByName('main', pages)
        cpuInfoWindow = getWindowByName('cpuInfo', pages)
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

    it('is on the correct runtime', async () => {
        const systemGetVersionResult = await mainWindow.evaluate(() => fin.System.getVersion())

        /**
         * The hosted app.json currently points to the beta release channel, so I will only verify the shape of the output
         * string - 4 numbers split by 3 periods - i.e. 21.93.63.4
         */
        expect(systemGetVersionResult.split('.').length).to.equal(4);
    })

    it('has the appropriate number of windows', async () => {
        // In this case, the HelloOpenFin app spaws 3 windows on creation and Playwright creates a page for each
        expect(pages.length).to.equal(INITIAL_WINDOW_COUNT);
    })

    it('has a main window', () => {
        expect(mainWindow).to.not.be.undefined
    })

    it('shows a notification when clicking main window notification button', async () => {
        await mainWindow.click('#desktop-notification')
        await mainWindow.waitForTimeout(3000)

        const newPages = await runtimeContext.pages();

        const notification = getWindowByName('notification', newPages)

        expect(notification).to.not.be.undefined
    })

    it('has a cpu info button', () => {
        expect(cpuInfoWindow).to.not.be.undefined
    })

    it('hides the cpu info window by default', async () => {
        const cpuInfoWindowIsShowing = await cpuInfoWindow.evaluate(() => fin.Window.getCurrentSync().isShowing())

        expect(cpuInfoWindowIsShowing).to.equal(false)
    })

    it('shows the cpu info window when clicking main window cpu info button', async () => {
        await mainWindow.click('#cpu-info')
        await mainWindow.waitForTimeout(1000)

        const cpuInfoWindowIsShowing = await cpuInfoWindow.evaluate(() => fin.Window.getCurrentSync().isShowing())

        expect(cpuInfoWindowIsShowing).to.equal(true)
    })

    it('exits when clicking close in the main window', async () => {
        await mainWindow.click('#close-app')
    })
})