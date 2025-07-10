import { test, expect } from '@playwright/test';

test.describe('Railway Site - Cross-Browser Visual Testing', () => {
  
  const testPages = ['/', '/blog', '/about'];
  
  testPages.forEach(page => {
    test(`Visual comparison - ${page}`, async ({ page: pw, browserName }) => {
      await pw.goto(page);
      await pw.waitForLoadState('networkidle');
      await pw.waitForTimeout(1000);
      
      // Full page screenshot for comparison
      await expect(pw).toHaveScreenshot(`${browserName}${page.replace('/', '-')}-full.png`, {
        fullPage: true,
        threshold: 0.1
      });
      
      // Hero/header section
      await expect(pw).toHaveScreenshot(`${browserName}${page.replace('/', '-')}-header.png`, {
        clip: { x: 0, y: 0, width: 1280, height: 600 },
        threshold: 0.1
      });
    });
  });

  test('Animation and Interaction Testing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test hover states on CTA buttons
    const ctaButtons = page.locator('a[href*="railway.com"], button[class*="cta"]');
    const buttonCount = await ctaButtons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = ctaButtons.nth(i);
      
      // Screenshot before hover (skip if not visible to avoid timeouts)
      try {
        if (await button.isVisible()) {
          await button.screenshot({ 
            path: `test-results/button-${i}-normal.png`,
            timeout: 5000
          });
          
          // Hover and screenshot
          await button.hover();
          await page.waitForTimeout(300);
          await button.screenshot({ 
            path: `test-results/button-${i}-hover.png`,
            timeout: 5000
          });
        }
      } catch (error) {
        console.log(`Button ${i} interaction failed: ${error.message}`);
      }
    }
    
    // Test theme toggle animation
    const themeToggle = page.locator('[class*="theme"], [id*="theme"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.screenshot({ path: 'test-results/theme-toggle-before.png' });
      await themeToggle.click();
      await page.waitForTimeout(500);
      await themeToggle.screenshot({ path: 'test-results/theme-toggle-after.png' });
    }
  });

  test('Responsive Grid Layout Testing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const breakpoints = [
      { width: 320, height: 568, name: 'mobile-xs' },
      { width: 375, height: 812, name: 'mobile-s' },
      { width: 414, height: 896, name: 'mobile-l' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'laptop' },
      { width: 1440, height: 900, name: 'desktop' },
      { width: 1920, height: 1080, name: 'desktop-xl' }
    ];
    
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(500);
      
      // Screenshot the grid/layout
      const featuresSection = page.locator('[class*="feature"], .features, [class*="grid"]').first();
      if (await featuresSection.isVisible()) {
        await featuresSection.screenshot({ 
          path: `test-results/grid-${bp.name}-${bp.width}x${bp.height}.png` 
        });
      }
      
      // Full viewport screenshot
      await expect(page).toHaveScreenshot(`layout-${bp.name}.png`, {
        clip: { x: 0, y: 0, width: bp.width, height: Math.min(bp.height, 1000) },
        threshold: 0.2
      });
    }
  });

  test('Typography Scale Testing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture typography elements
    const textElements = [
      { selector: 'h1', name: 'heading-1' },
      { selector: 'h2', name: 'heading-2' },
      { selector: 'h3', name: 'heading-3' },
      { selector: 'p', name: 'paragraph' },
      { selector: 'button, .button', name: 'button-text' },
      { selector: 'a', name: 'link-text' }
    ];
    
    for (const element of textElements) {
      const el = page.locator(element.selector).first();
      if (await el.isVisible()) {
        await el.screenshot({ 
          path: `test-results/typography-${element.name}.png`,
          clip: { x: 0, y: 0, width: 400, height: 100 }
        });
      }
    }
  });

  test('Color Contrast and Theme Testing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test light theme
    await expect(page).toHaveScreenshot('color-theme-light.png', {
      clip: { x: 0, y: 0, width: 1280, height: 800 },
      threshold: 0.1
    });
    
    // Switch to dark theme
    const themeToggle = page.locator('[class*="theme"], [id*="theme"], button[aria-label*="theme"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      // Test dark theme
      await expect(page).toHaveScreenshot('color-theme-dark.png', {
        clip: { x: 0, y: 0, width: 1280, height: 800 },
        threshold: 0.1
      });
      
      // Test specific elements in dark mode
      const heroSection = page.locator('[class*="hero"], .hero').first();
      if (await heroSection.isVisible()) {
        await heroSection.screenshot({ path: 'test-results/dark-mode-hero.png' });
      }
    }
  });

});
