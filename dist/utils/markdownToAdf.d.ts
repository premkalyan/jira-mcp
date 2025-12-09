/**
 * Markdown to Atlassian Document Format (ADF) Converter
 * Converts common Markdown syntax to ADF JSON structure for Jira Cloud
 */
interface AdfNode {
    type: string;
    attrs?: Record<string, any>;
    content?: AdfNode[];
    text?: string;
    marks?: Array<{
        type: string;
        attrs?: Record<string, any>;
    }>;
}
interface AdfDocument {
    type: 'doc';
    version: 1;
    content: AdfNode[];
}
/**
 * Convert Markdown text to ADF document structure
 */
export declare function markdownToAdf(markdown: string): AdfDocument;
/**
 * Check if a string looks like it contains Markdown formatting
 */
export declare function looksLikeMarkdown(text: string): boolean;
export {};
