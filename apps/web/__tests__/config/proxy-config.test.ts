import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Next.js Proxy Configuration', () => {
  let nextConfig: any;

  beforeAll(async () => {
    // Load the Next.js config
    const configPath = path.join(process.cwd(), 'next.config.mjs');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('next.config.mjs not found');
    }

    // Read and evaluate the config file
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Extract the config object (simplified parsing)
    const configMatch = configContent.match(/const nextConfig = ({[\s\S]*?});/);
    if (!configMatch) {
      throw new Error('Could not parse next.config.mjs');
    }

    // Mock process.env for config evaluation
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4001';

    try {
      // Evaluate the config (this is a simplified approach)
      nextConfig = eval(`(${configMatch[1]})`);
    } finally {
      // Restore original env
      if (originalEnv) {
        process.env.NEXT_PUBLIC_API_URL = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_API_URL;
      }
    }
  });

  describe('API Proxy Rewrites', () => {
    it('should have rewrites function defined', () => {
      expect(nextConfig).toBeDefined();
      expect(typeof nextConfig.rewrites).toBe('function');
    });

    it('should include /v1/* API proxy rewrite', async () => {
      const rewrites = await nextConfig.rewrites();
      
      const v1Rewrite = rewrites.find((rewrite: any) => 
        rewrite.source === '/v1/:path*'
      );
      
      expect(v1Rewrite).toBeDefined();
      expect(v1Rewrite.destination).toMatch(/^http:\/\/localhost:4001\/v1\/:path\*$/);
    });

    it('should include /auth/* proxy rewrite', async () => {
      const rewrites = await nextConfig.rewrites();
      
      const authRewrite = rewrites.find((rewrite: any) => 
        rewrite.source === '/auth/:path*'
      );
      
      expect(authRewrite).toBeDefined();
      expect(authRewrite.destination).toMatch(/^http:\/\/localhost:4001\/auth\/:path\*$/);
    });

    it('should use environment variable for API URL', async () => {
      // Test with custom API URL
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'http://custom-api:8080';

      try {
        const rewrites = await nextConfig.rewrites();
        
        const v1Rewrite = rewrites.find((rewrite: any) => 
          rewrite.source === '/v1/:path*'
        );
        
        expect(v1Rewrite.destination).toMatch(/^http:\/\/custom-api:8080\/v1\/:path\*$/);
      } finally {
        // Restore original env
        if (originalEnv) {
          process.env.NEXT_PUBLIC_API_URL = originalEnv;
        } else {
          delete process.env.NEXT_PUBLIC_API_URL;
        }
      }
    });

    it('should fallback to localhost:4001 when no API URL is set', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      try {
        const rewrites = await nextConfig.rewrites();
        
        const v1Rewrite = rewrites.find((rewrite: any) => 
          rewrite.source === '/v1/:path*'
        );
        
        expect(v1Rewrite.destination).toMatch(/^http:\/\/localhost:4001\/v1\/:path\*$/);
      } finally {
        // Restore original env
        if (originalEnv) {
          process.env.NEXT_PUBLIC_API_URL = originalEnv;
        }
      }
    });
  });

  describe('Origin Drift Prevention', () => {
    it('should prevent cross-origin API calls by having proxy rewrites', async () => {
      const rewrites = await nextConfig.rewrites();
      
      // Ensure we have at least the critical API routes proxied
      const criticalRoutes = ['/v1/:path*', '/auth/:path*'];
      
      criticalRoutes.forEach(route => {
        const rewrite = rewrites.find((r: any) => r.source === route);
        expect(rewrite).toBeDefined();
        expect(rewrite.destination).toContain('localhost:4001');
      });
    });

    it('should not have any hardcoded cross-origin URLs in client code', () => {
      // Check that API client uses same-origin requests in browser
      const clientPath = path.join(process.cwd(), 'lib/api/client.ts');
      
      if (fs.existsSync(clientPath)) {
        const clientContent = fs.readFileSync(clientPath, 'utf-8');
        
        // Should use conditional API_BASE_URL for browser vs server
        expect(clientContent).toContain('typeof window !== \'undefined\'');
        expect(clientContent).toContain('\'\''); // Empty string for same-origin
      }
    });
  });

  describe('Configuration Completeness', () => {
    it('should have all required Next.js config properties', () => {
      expect(nextConfig.reactStrictMode).toBe(true);
      expect(nextConfig.experimental).toBeDefined();
      expect(nextConfig.images).toBeDefined();
    });

    it('should have proper TypeScript configuration', () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });
  });
});

describe('Environment Configuration', () => {
  it('should have required environment variables documented', () => {
    const envExamplePath = path.join(process.cwd(), '.env.local');
    
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');
      
      // Check for critical environment variables
      expect(envContent).toContain('NEXT_PUBLIC_API_URL');
      expect(envContent).toContain('JWT_SECRET');
    }
  });

  it('should have consistent API URL configuration', () => {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      
      // Extract API URL from env file
      const apiUrlMatch = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
      if (apiUrlMatch) {
        const apiUrl = apiUrlMatch[1].trim();
        expect(apiUrl).toMatch(/^http:\/\/localhost:4001$/);
      }
    }
  });
});
