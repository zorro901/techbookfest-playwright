import {Page} from '@playwright/test'

export const gotoRetry = async (page: Page, url: string, retryCount = 2, waitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' = 'load') => {
    if (retryCount < 0) {
        throw new Error(`Failed to navigate to ${url} after 3 retries.`)
    }
    await Promise.all([
        page.goto(url, {
            timeout: 120 * 1000,
            waitUntil
        }),
        page.waitForResponse((response) => response.ok(), {timeout: 8000})
    ]).catch(() => {
        gotoRetry(page, url, retryCount - 1)
    })
}
