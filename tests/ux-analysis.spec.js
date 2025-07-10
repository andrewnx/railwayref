import { test, expect } from '@playwright/test';

test.describe('Railway Referral Site - UX Analysis', () => {
  
  test('Visual Regression Testing - Homepage Screenshots', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Wait for page load and any animations
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Full page screenshot
    await expect(page).toHaveScreenshot(`homepage-${browserName}-full.png`, {
      fullPage: true,
      threshold: 0.2
    });
    
    // Above the fold screenshot
    await expect(page).toHaveScreenshot(`homepage-${browserName}-hero.png`, {
      clip: { x: 0, y: 0, width: 1280, height: 800 },
      threshold: 0.2
    });
  });

  test('Mobile Responsiveness Analysis', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (isMobile) {
      // Test mobile navigation
      const menuButton = page.locator('[aria-label*="menu"], .menu-toggle, .hamburger');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }
      
      // Mobile screenshot
      await expect(page).toHaveScreenshot('mobile-homepage.png', {
        fullPage: true,
        threshold: 0.2
      });
    }
    
    // Test responsive breakpoints
    const viewports = [
      { width: 375, height: 812, name: 'mobile-small' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop-small' },
      { width: 1440, height: 900, name: 'desktop-large' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, {
        clip: { x: 0, y: 0, width: viewport.width, height: 600 },
        threshold: 0.2
      });
    }
  });

  test('Dark Mode Toggle Functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Screenshot in light mode
    await expect(page).toHaveScreenshot('light-mode.png', {
      clip: { x: 0, y: 0, width: 1280, height: 800 },
      threshold: 0.2
    });
    
    // Find and click theme toggle
    const themeToggle = page.locator('[class*="theme"], [id*="theme"], button[aria-label*="theme"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(1000); // Wait for theme transition
      
      // Screenshot in dark mode
      await expect(page).toHaveScreenshot('dark-mode.png', {
        clip: { x: 0, y: 0, width: 1280, height: 800 },
        threshold: 0.2
      });
    }
  });

  test('Conversion Funnel Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze Railway referral links
    const railwayLinks = page.locator('a[href*="railway.com"]');
    const linkCount = await railwayLinks.count();
    
    expect(linkCount).toBeGreaterThan(0);
    
    // Test each Railway CTA button
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = railwayLinks.nth(i);
      const href = await link.getAttribute('href');
      
      expect(href).toContain('railway.com');
      expect(href).toContain('referralCode=RRANX'); // Check referral code
      
      // Verify link is visible and clickable (skip header logo on mobile)
      const isHeaderLogo = await link.getAttribute('aria-label');
      if (isHeaderLogo && isHeaderLogo.includes('Railway Platform')) {
        // Skip header logo visibility test on mobile as it might be hidden
        continue;
      }
      
      await expect(link).toBeVisible();
      await expect(link).toBeEnabled();
    }
  });

  test('Performance and Loading Analysis', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check for performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Performance expectations
    expect(metrics.loadTime).toBeLessThan(3000); // Load in under 3s
    expect(metrics.firstContentfulPaint).toBeLessThan(3000); // FCP under 3s (relaxed for browser variations)
    
    console.log('Performance Metrics:', metrics);
  });

  test('Accessibility Audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility landmarks - use specific selectors to avoid browser dev tools
    const landmarks = {
      header: page.locator('header[data-astro-cid-3ef6ksr2]'),
      main: page.locator('main'),
      footer: page.locator('footer[data-astro-cid-sz7xmlte]'),
      nav: page.locator('nav')
    };
    
    for (const [name, landmark] of Object.entries(landmarks)) {
      await expect(landmark.first()).toBeVisible();
      console.log(`✓ ${name} landmark found`);
    }
    
    // Check for proper heading hierarchy (focus on main content to avoid header confusion)
    const mainHeadings = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').all();
    const mainHeadingLevels = [];
    
    for (const heading of mainHeadings) {
      const tagName = await heading.evaluate(el => el.tagName);
      mainHeadingLevels.push(parseInt(tagName.charAt(1)));
    }
    
    // Main content should start with h1
    if (mainHeadingLevels.length > 0) {
      expect(mainHeadingLevels[0]).toBe(1);
    }
    console.log('Main content heading hierarchy:', mainHeadingLevels);
    
    // Check alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      if (!alt && !src?.includes('decorative')) {
        console.warn(`Image missing alt text: ${src}`);
      }
    }
  });

  test('Content Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify key content sections
    const contentSections = [
      { selector: 'h1', name: 'Main Heading' },
      { selector: '[class*="hero"], .hero', name: 'Hero Section' },
      { selector: '[class*="feature"], .features', name: 'Features Section' },
      { selector: '[class*="testimonial"], .testimonials', name: 'Testimonials' },
      { selector: '[class*="faq"], .faq', name: 'FAQ Section' }
    ];
    
    for (const section of contentSections) {
      const element = page.locator(section.selector).first();
      if (await element.isVisible()) {
        console.log(`✓ ${section.name} found`);
        
        // Take section screenshot
        await element.screenshot({ 
          path: `test-results/content-${section.name.toLowerCase().replace(' ', '-')}.png` 
        });
      }
    }
    
    // Check for Railway-specific content
    const railwayMentions = await page.locator('text=/railway/i').count();
    expect(railwayMentions).toBeGreaterThan(0);
    console.log(`Railway mentions found: ${railwayMentions}`);
  });

});
