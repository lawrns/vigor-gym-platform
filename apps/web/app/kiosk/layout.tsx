import React from 'react';

interface KioskLayoutProps {
  children: React.ReactNode;
}

/**
 * Minimal layout for kiosk routes
 *
 * This layout excludes the navbar, footer, and other dashboard chrome
 * to provide a clean, distraction-free kiosk experience.
 *
 * Features:
 * - No navbar/footer (excluded by layout design, not JS manipulation)
 * - Full-screen layout optimized for kiosk displays
 * - Dark mode support
 * - Minimal chrome for focused user experience
 */
export default function KioskLayout({ children }: KioskLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 kiosk-layout">
      {/* Global kiosk styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Hide any global navigation elements in kiosk mode */
          .kiosk-layout nav,
          .kiosk-layout footer,
          .kiosk-layout .theme-toggle {
            display: none !important;
          }

          /* Ensure full-screen experience */
          .kiosk-layout {
            overflow-x: hidden;
          }

          /* Prevent text selection for kiosk displays */
          .kiosk-layout {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }

          /* Allow text selection in input fields */
          .kiosk-layout input,
          .kiosk-layout textarea {
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
          }
        `
      }} />

      {/* Kiosk content */}
      {children}
    </div>
  );
}
