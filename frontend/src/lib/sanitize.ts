/**
 * Strip dangerous HTML tags and attributes from untrusted content.
 * Allows formatting tags (p, ul, ol, li, strong, em, br, h2, h3, a)
 * but removes script, iframe, event handlers, etc.
 */
export function sanitizeHtml(html: string): string {
  return html
    // Remove script/iframe/object/embed tags and their content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\s+on\w+\s*=\s*\S+/gi, "")
    // Remove javascript: URLs
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    .replace(/src\s*=\s*["']javascript:[^"']*["']/gi, "");
}
