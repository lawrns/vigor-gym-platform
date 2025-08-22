#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the schema (we'll need to compile TypeScript first)
async function validateContent() {
  try {
    console.log('🔍 Validating home.v2.json content schema...');
    
    // Read the content file
    const contentPath = join(__dirname, '../lib/content/home.v2.json');
    const contentRaw = readFileSync(contentPath, 'utf-8');
    const content = JSON.parse(contentRaw);
    
    // For now, do basic validation until we can import the TypeScript schema
    const requiredSections = [
      'sections_order',
      'HeroCinematic',
      'KPI_Counters',
      'FeatureGridLight',
      'PlansV2',
      'HowItWorks',
      'FinalCTA',
      'FAQAccordion'
    ];
    
    const missingSections = requiredSections.filter(section => !content[section]);
    
    if (missingSections.length > 0) {
      console.error('❌ Missing required sections:', missingSections);
      process.exit(1);
    }
    
    // Validate sections_order is an array
    if (!Array.isArray(content.sections_order)) {
      console.error('❌ sections_order must be an array');
      process.exit(1);
    }
    
    // Check for undefined sections referenced in sections_order
    const undefinedSections = content.sections_order.filter(section => {
      // Skip navbar and footer as they're handled differently
      if (section === 'NavbarSticky' || section === 'FooterMega') return false;
      return !content[section];
    });
    
    if (undefinedSections.length > 0) {
      console.warn('⚠️  Sections in sections_order but not defined:', undefinedSections);
      console.warn('   These sections need to be implemented or removed from sections_order');
    }
    
    // Validate CTA data attributes for analytics
    const ctaElements = [];
    
    function findCTAs(obj, path = '') {
      if (typeof obj !== 'object' || obj === null) return;
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (key === 'cta' || key.includes('Cta')) {
          ctaElements.push({ path: currentPath, cta: value });
        }
        
        if (typeof value === 'object') {
          findCTAs(value, currentPath);
        }
      }
    }
    
    findCTAs(content);
    
    const missingDataCta = ctaElements.filter(({ cta }) => 
      cta && typeof cta === 'object' && !cta['data-cta']
    );
    
    if (missingDataCta.length > 0) {
      console.warn('⚠️  CTAs missing data-cta attribute for analytics:');
      missingDataCta.forEach(({ path }) => console.warn(`   - ${path}`));
    }
    
    console.log('✅ Content validation passed');
    console.log(`📊 Found ${ctaElements.length} CTA elements`);
    console.log(`📄 Found ${content.sections_order.length} sections in order`);
    
    // List implemented vs missing sections
    const implementedSections = content.sections_order.filter(section => 
      content[section] || section === 'NavbarSticky' || section === 'FooterMega'
    );
    const missingSectionImplementations = content.sections_order.filter(section => 
      !content[section] && section !== 'NavbarSticky' && section !== 'FooterMega'
    );
    
    console.log(`✅ Implemented sections: ${implementedSections.length}/${content.sections_order.length}`);
    if (missingSectionImplementations.length > 0) {
      console.log('📝 Sections needing implementation:');
      missingSectionImplementations.forEach(section => console.log(`   - ${section}`));
    }
    
  } catch (error) {
    console.error('❌ Content validation failed:', error.message);
    process.exit(1);
  }
}

validateContent();
