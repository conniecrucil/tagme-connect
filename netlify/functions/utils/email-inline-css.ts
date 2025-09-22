import juice from 'juice';

/**
 * Converts CSS styles in HTML to inline styles for better email client compatibility
 * @param html - HTML string with CSS in <style> tags
 * @returns HTML string with inline CSS styles
 */
export function inlineEmailCSS(html: string): string {
  try {
    return juice(html, {
      // Preserve media queries in the head for responsive design
      preserveMediaQueries: true,
      // Remove style tags after inlining
      removeStyleTags: true,
      // Apply styles to all elements, not just those with classes
      applyStyleTags: true,
      // Preserve important styles
      preserveImportant: true,
      // Insert styles in the head
      insertPreservedExtraCss: true,
      // Webkit specific styles for better email client support
      webResources: {
        images: false,
        svgs: false,
        scripts: false,
        links: false,
        relativeTo: ''
      }
    });
  } catch (error) {
    console.error('Error inlining CSS for email:', error);
    // Return original HTML if inlining fails
    return html;
  }
}

/**
 * Converts CSS styles in HTML to inline styles with custom options
 * @param html - HTML string with CSS in <style> tags
 * @param options - Juice options for customization
 * @returns HTML string with inline CSS styles
 */
export function inlineEmailCSSWithOptions(html: string, options: any = {}): string {
  try {
    const defaultOptions = {
      preserveMediaQueries: true,
      removeStyleTags: true,
      applyStyleTags: true,
      preserveImportant: true,
      insertPreservedExtraCss: true,
      webResources: {
        images: false,
        svgs: false,
        scripts: false,
        links: false,
        relativeTo: ''
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    return juice(html, finalOptions);
  } catch (error) {
    console.error('Error inlining CSS for email with custom options:', error);
    return html;
  }
}
