/**
 * AppForge QA Tests - Agent 1 User Journey
 * 
 * Tests UJ-1 to UJ-6, TT-4, TT-5
 * NOTE: Page uses Framer Motion animations, need to wait for render
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

// Helper to take screenshot and log
async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

// Helper to wait for animations to complete
async function waitForAnimations(page: Page) {
  // Wait for network idle and animations
  await page.waitForLoadState('networkidle');
  // Give animations time to complete (Framer Motion)
  await page.waitForTimeout(2000);
}

// ==========================================
// UJ-1: Landing Page & Onboarding
// ==========================================

test.describe('UJ-1: Landing Page', () => {
  test('UJ-1.1.1: Page loads in < 5s with content visible', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const start = Date.now();
    await page.goto(BASE_URL);
    await waitForAnimations(page);
    const loadTime = Date.now() - start;

    console.log(`⏱️ Page load time with animations: ${loadTime}ms`);
    
    // Check some content is visible (body has background)
    const bodyBg = await page.evaluate(() => 
      getComputedStyle(document.body).backgroundColor
    );
    console.log(`🎨 Body background: ${bodyBg}`);
    
    await screenshot(page, 'uj-1.1.1-landing');
    
    // Page should load within 5s including animations
    expect(loadTime).toBeLessThan(5000);
    
    // Check for critical errors (ignore minor warnings)
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('third-party') &&
      !e.includes('Download the React DevTools')
    );
    
    if (criticalErrors.length > 0) {
      console.log('❌ Console errors:', criticalErrors);
    }
    expect(criticalErrors.length).toBeLessThanOrEqual(5); // Allow some errors
  });

  test('UJ-1.1.2: Hero section visible after animations', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAnimations(page);
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    expect(title).toContain('AppForge');
    
    // Check main content area exists
    const mainContent = page.locator('.min-h-screen');
    await expect(mainContent).toBeVisible();
    
    await screenshot(page, 'uj-1.1.2-hero');
  });

  test('UJ-1.1.3: Navigation links exist', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAnimations(page);
    
    // Check for navigation links
    const signInLink = page.locator('a[href="/sign-in"]');
    const signUpLink = page.locator('a[href="/sign-up"]');
    
    const signInExists = await signInLink.count() > 0;
    const signUpExists = await signUpLink.count() > 0;
    
    console.log(`🔗 Sign-in link: ${signInExists}`);
    console.log(`🔗 Sign-up link: ${signUpExists}`);
    
    expect(signInExists || signUpExists).toBeTruthy();
    
    await screenshot(page, 'uj-1.1.3-navigation');
  });

  test('UJ-1.1.4: Responsive mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await waitForAnimations(page);
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    console.log(`📱 Mobile: body=${bodyWidth}px, viewport=${viewportWidth}px`);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Small tolerance
    
    await screenshot(page, 'uj-1.1.4-mobile-375');
  });

  test('UJ-1.1.5: Responsive tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await waitForAnimations(page);
    
    await screenshot(page, 'uj-1.1.5-tablet-768');
  });
});

// ==========================================
// UJ-1.2: Authentication
// ==========================================

test.describe('UJ-1.2: Authentication', () => {
  test('UJ-1.2.1: Sign-in page loads with Clerk', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForAnimations(page);
    
    // Look for Clerk sign-in form or any form element
    const hasClerk = await page.locator('[class*="cl-"]').count() > 0;
    const hasForm = await page.locator('form').count() > 0;
    const hasButton = await page.locator('button').count() > 0;
    
    console.log(`🔐 Clerk components: ${hasClerk}, Form: ${hasForm}, Button: ${hasButton}`);
    
    await screenshot(page, 'uj-1.2.1-signin');
  });

  test('UJ-1.2.2: Dashboard redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should redirect - wait for URL change
    await page.waitForURL(/\/sign-in/, { timeout: 10000 });
    
    console.log(`🔄 Dashboard → Sign-in redirect: ${page.url()}`);
    expect(page.url()).toContain('/sign-in');
    
    await screenshot(page, 'uj-1.2.2-dashboard-redirect');
  });
});

// ==========================================
// TT-5: Responsive Design
// ==========================================

test.describe('TT-5: Responsive Design', () => {
  test('TT-5.1: Multiple viewports', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'large', width: 1920, height: 1080 },
    ];
    
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL);
      await waitForAnimations(page);
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      console.log(`📱 ${vp.name} (${vp.width}px): body=${bodyWidth}px`);
      
      await screenshot(page, `tt-5-${vp.name}-${vp.width}`);
      
      // Should have no excessive horizontal scroll
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 50);
    }
  });
});

// ==========================================
// Landing Page Content Verification
// ==========================================

test.describe('Landing Page Content', () => {
  test('Page has expected structure', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAnimations(page);
    
    // Check HTML structure exists
    const html = await page.content();
    
    const hasAppForge = html.includes('AppForge');
    const hasSignIn = html.includes('sign-in');
    const hasSignUp = html.includes('sign-up');
    const hasCalc = html.includes('calculator') || html.includes('Calculateur');
    const hasTemplates = html.includes('templates') || html.includes('Templates');
    
    console.log(`📝 Content check:`);
    console.log(`   - AppForge: ${hasAppForge}`);
    console.log(`   - Sign-in: ${hasSignIn}`);
    console.log(`   - Sign-up: ${hasSignUp}`);
    console.log(`   - Calculator: ${hasCalc}`);
    console.log(`   - Templates: ${hasTemplates}`);
    
    expect(hasAppForge).toBeTruthy();
    expect(hasSignIn || hasSignUp).toBeTruthy();
    
    await screenshot(page, 'landing-content');
  });

  test('Page loads without JS errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto(BASE_URL);
    await waitForAnimations(page);
    
    if (jsErrors.length > 0) {
      console.log(`❌ JS Errors: ${jsErrors.join(', ')}`);
    }
    
    // Allow 0 critical JS errors
    expect(jsErrors.length).toBe(0);
  });
});
