import {Page, webkit} from '@playwright/test'
import {delay} from './lib/Delay'
import {gotoRetry} from './lib/GotoRetry'
import {addBook, Book} from './lib/AddBooks'

(async () => {
    const browser = await webkit.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list'
        ]
    })
    const context = await browser.newContext({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.102 Safari/537.36 Edg/104.0.1293.70'})
    const page: Page = await context.newPage()
    await page.route('**/*', route => {
        route.request().resourceType() === 'image' ||
        route.request().resourceType() === 'media' ||
        route.request().resourceType() === 'font' ||
        route.request().resourceType() === 'texttrack' ||
        route.request().resourceType() === 'websocket' ||
        route.request().resourceType() === 'manifest' ||
        route.request().resourceType() === 'beacon'
            ? route.abort() : route.continue()
    })

    await gotoRetry(page, 'https://techbookfest.org/market/all', 2, 'networkidle')

    let books: Book[] = []
    let addBookPromise = []

    for (; true;) {
        const elements = await page.locator('#__next > div > div > div > div > div > div.css-1dbjc4n.r-13awgt0.r-18u37iz.r-1777fci .css-1dbjc4n.r-18u37iz.r-1777fci > div > div > div.css-1dbjc4n')
        books = await elements.evaluateAll(list => list.map(element => {
                let link = element.querySelector('a')!.href
                let titleElement
                let title
                try {
                    titleElement = element.querySelector('a > div:last-child > div:first-child > div')! as HTMLDivElement
                    title = titleElement.title
                } catch (error) {
                    let textContent = element.querySelector('a > div:last-child > div:first-child')!.textContent
                    title = textContent!
                    console.log(error)
                }
                let price = Number((element.querySelector('a > div:last-child > div:last-child')! as HTMLDivElement).textContent!.replace('¥', ''))
                return {title, price, link}
            }
        ))
        if (books.length === 0) break

        for (let i = 0; i < books.length; i++) {
            const promise = new Promise(() => addBook(books[i]))
            addBookPromise.push(promise)
        }

        await Promise.all(addBookPromise)

        await delay(1000)
        books = []
        addBookPromise = []

        await page.evaluate(() => {
            const styledElements = document.querySelectorAll('#__next > div > div > div > div > div > div.css-1dbjc4n.r-13awgt0.r-18u37iz.r-1777fci .css-1dbjc4n.r-18u37iz.r-1777fci > div > div > div.css-1dbjc4n')
            styledElements.forEach(elm => elm.remove())
        })
        try {
            await page.locator('.css-1dbjc4n a:first-child > div').nth(0).waitFor({state: 'attached', timeout: 10000})
        } catch (error) {
        }
        await delay(1000)
    }

    await browser.close()
})()
