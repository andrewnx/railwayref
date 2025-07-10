import { test, expect } from '@playwright/test';

test.describe('Railway Site - Conversion Optimization Analysis', () => {

  test('CTA Button Analysis and Optimization', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find all Railway referral links
    const railwayLinks = page.locator('a[href*="railway.com"]');
    const linkCount = await railwayLinks.count();
    
    console.log(`Found ${linkCount} Railway referral links`);
    
    const ctaAnalysis = [];
    
    for (let i = 0; i < linkCount; i++) {
      const link = railwayLinks.nth(i);
      
      const analysis = {
        index: i,
        text: await link.textContent(),
        href: await link.getAttribute('href'),
        isVisible: await link.isVisible(),
        boundingBox: await link.boundingBox(),
        classes: await link.getAttribute('class'),
        ariaLabel: await link.getAttribute('aria-label')
      };
      
      // Check if referral code is present
      analysis.hasReferralCode = analysis.href?.includes('referralCode=RRANX') || false;
      
      // Measure click area (should be at least 44x44px for mobile)
      if (analysis.boundingBox) {
        analysis.clickAreaSize = {
          width: analysis.boundingBox.width,
          height: analysis.boundingBox.height,
          adequateSize: analysis.boundingBox.width >= 44 && analysis.boundingBox.height >= 44
        };
      }
      
      ctaAnalysis.push(analysis);
      
      // Take screenshot of each CTA (skip if not visible to avoid timeouts)
      try {
        if (await link.isVisible()) {
          await link.screenshot({ 
            path: `test-results/cta-button-${i}.png`,
            clip: { x: 0, y: 0, width: 200, height: 60 },
            timeout: 5000
          });
        }
      } catch (error) {
        console.log(`Screenshot failed for CTA ${i}: ${error.message}`);
      }
    }
    
    console.log('CTA Analysis Results:', JSON.stringify(ctaAnalysis, null, 2));
    
    // Verify all CTAs have referral codes
    const missingReferrals = ctaAnalysis.filter(cta => !cta.hasReferralCode);
    expect(missingReferrals.length).toBe(0);
    
    // Verify adequate click targets
    const smallClickTargets = ctaAnalysis.filter(cta => 
      cta.clickAreaSize && !cta.clickAreaSize.adequateSize
    );
    
    if (smallClickTargets.length > 0) {
      console.warn('Small click targets found:', smallClickTargets);
    }
  });

  test('Page Flow and Funnel Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure time to first CTA visibility (with fallback for mobile)
    const startTime = Date.now();
    try {
      await page.locator('a[href*="railway.com"]').first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (error) {
      // Fallback: look for any visible CTA button
      await page.locator('.btn-primary').first().waitFor({ state: 'visible', timeout: 5000 });
    }
    const timeToFirstCTA = Date.now() - startTime;
    
    console.log(`Time to first CTA visible: ${timeToFirstCTA}ms`);
    expect(timeToFirstCTA).toBeLessThan(2000); // Should be visible within 2s
    
    // Analyze page sections and their CTA placement
    const sections = await page.locator('section, [class*="section"], .hero, .features, .testimonials, .faq').all();
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionCTAs = section.locator('a[href*="railway.com"]');
      const ctaCount = await sectionCTAs.count();
      
      if (ctaCount > 0) {
        const sectionText = await section.textContent();
        const sectionClass = await section.getAttribute('class');
        
        console.log(`Section ${i} (${sectionClass}): ${ctaCount} CTAs`);
        
        // Screenshot section with CTAs
        await section.screenshot({ 
          path: `test-results/section-${i}-ctas.png` 
        });
      }
    }
  });

  test('Mobile Conversion Optimization', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 812 });
    }
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test mobile-specific CTA visibility
    const mobileCTAs = page.locator('a[href*="railway.com"]');
    const mobileCtaCount = await mobileCTAs.count();
    
    for (let i = 0; i < mobileCtaCount; i++) {
      const cta = mobileCTAs.nth(i);
      const boundingBox = await cta.boundingBox();
      
      if (boundingBox) {
        // Check if CTA is in viewport
        const isInViewport = boundingBox.y >= 0 && boundingBox.y <= 812;
        const isTouchFriendly = boundingBox.width >= 44 && boundingBox.height >= 44;
        
        console.log(`Mobile CTA ${i}: In viewport: ${isInViewport}, Touch-friendly: ${isTouchFriendly}`);
        
        if (!isTouchFriendly) {
          console.warn(`CTA ${i} is not touch-friendly: ${boundingBox.width}x${boundingBox.height}`);
        }
      }
    }
    
    // Test mobile scroll behavior and CTA visibility
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('mobile-scroll-ctas.png', {
      clip: { x: 0, y: 0, width: 375, height: 812 },
      threshold: 0.2
    });
  });

  test('User Experience Heuristics Evaluation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const heuristicChecks = {
      visibilityOfSystemStatus: false,
      userControlAndFreedom: false,
      consistencyAndStandards: false,
      errorPrevention: false,
      recognitionRatherThanRecall: false,
      flexibilityAndEfficiency: false,
      aestheticAndMinimalistDesign: false,
      helpAndDocumentation: false
    };
    
    // Check for loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [aria-live]');
    if (await loadingIndicators.count() > 0) {
      heuristicChecks.visibilityOfSystemStatus = true;
    }
    
    // Check for navigation/back buttons
    const navElements = page.locator('nav, [role="navigation"], [class*="breadcrumb"]');
    if (await navElements.count() > 0) {
      heuristicChecks.userControlAndFreedom = true;
    }
    
    // Check for consistent button styling
    const buttons = page.locator('button, .button, a[class*="btn"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 1) {
      // Sample button styles for consistency
      const firstButtonClass = await buttons.first().getAttribute('class');
      const lastButtonClass = await buttons.last().getAttribute('class');
      
      // Basic consistency check
      if (firstButtonClass && lastButtonClass && 
          (firstButtonClass.includes('btn') || lastButtonClass.includes('btn'))) {
        heuristicChecks.consistencyAndStandards = true;
      }
    }
    
    // Check for help/FAQ content
    const helpContent = page.locator('[class*="faq"], [class*="help"], [class*="support"]');
    if (await helpContent.count() > 0) {
      heuristicChecks.helpAndDocumentation = true;
    }
    
    // Check for theme toggle (flexibility)
    const themeToggle = page.locator('[class*="theme"], [id*="theme"]');
    if (await themeToggle.count() > 0) {
      heuristicChecks.flexibilityAndEfficiency = true;
    }
    
    console.log('UX Heuristics Evaluation:', heuristicChecks);
    
    // Calculate heuristics score
    const passedChecks = Object.values(heuristicChecks).filter(Boolean).length;
    const totalChecks = Object.keys(heuristicChecks).length;
    const heuristicsScore = (passedChecks / totalChecks) * 100;
    
    console.log(`UX Heuristics Score: ${heuristicsScore.toFixed(1)}% (${passedChecks}/${totalChecks})`);
  });

  test('Conversion Path Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Trace user journey from landing to first CTA
    const conversionPath = [];
    
    // 1. Landing - Hero section visibility
    const heroSection = page.locator('[class*="hero"], .hero, h1').first();
    if (await heroSection.isVisible()) {
      conversionPath.push('Hero section visible');
      await heroSection.screenshot({ path: 'test-results/conversion-step-1-hero.png' });
    }
    
    // 2. Value proposition - Features section
    const featuresSection = page.locator('[class*="feature"], .features').first();
    if (await featuresSection.isVisible()) {
      conversionPath.push('Features section visible');
      await featuresSection.scrollIntoViewIfNeeded();
      await featuresSection.screenshot({ path: 'test-results/conversion-step-2-features.png' });
    }
    
    // 3. Social proof - Testimonials
    const testimonialsSection = page.locator('[class*="testimonial"], .testimonials').first();
    if (await testimonialsSection.isVisible()) {
      conversionPath.push('Testimonials visible');
      await testimonialsSection.scrollIntoViewIfNeeded();
      await testimonialsSection.screenshot({ path: 'test-results/conversion-step-3-testimonials.png' });
    }
    
    // 4. Objection handling - FAQ
    const faqSection = page.locator('[class*="faq"], .faq').first();
    if (await faqSection.isVisible()) {
      conversionPath.push('FAQ section visible');
      await faqSection.scrollIntoViewIfNeeded();
      await faqSection.screenshot({ path: 'test-results/conversion-step-4-faq.png' });
    }
    
    // 5. Final CTA
    const finalCTA = page.locator('a[href*="railway.app"]').last();
    if (await finalCTA.isVisible()) {
      conversionPath.push('Final CTA visible');
      await finalCTA.scrollIntoViewIfNeeded();
      await finalCTA.screenshot({ path: 'test-results/conversion-step-5-final-cta.png' });
    }
    
    console.log('Conversion Path:', conversionPath);
    expect(conversionPath.length).toBeGreaterThan(2); // Should have at least hero + CTA
  });

});
