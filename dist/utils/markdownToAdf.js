/**
 * Markdown to Atlassian Document Format (ADF) Converter
 * Converts common Markdown syntax to ADF JSON structure for Jira Cloud
 */
/**
 * Convert Markdown text to ADF document structure
 */
export function markdownToAdf(markdown) {
    const lines = markdown.split('\n');
    const content = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // Skip empty lines
        if (line.trim() === '') {
            i++;
            continue;
        }
        // Headers (## Header)
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            content.push({
                type: 'heading',
                attrs: { level: headerMatch[1].length },
                content: parseInlineFormatting(headerMatch[2])
            });
            i++;
            continue;
        }
        // Horizontal rule (---, ***, ___)
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            content.push({ type: 'rule' });
            i++;
            continue;
        }
        // Code block (```)
        if (line.trim().startsWith('```')) {
            const language = line.trim().slice(3) || 'text';
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            content.push({
                type: 'codeBlock',
                attrs: { language },
                content: [{ type: 'text', text: codeLines.join('\n') }]
            });
            i++;
            continue;
        }
        // Blockquote (> text)
        if (line.trim().startsWith('>')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].trim().startsWith('>')) {
                quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
                i++;
            }
            content.push({
                type: 'blockquote',
                content: [{
                        type: 'paragraph',
                        content: parseInlineFormatting(quoteLines.join(' '))
                    }]
            });
            continue;
        }
        // Unordered list (- item or * item)
        if (/^[\-\*]\s+/.test(line.trim())) {
            const listItems = [];
            while (i < lines.length && /^[\-\*]\s+/.test(lines[i].trim())) {
                const itemText = lines[i].trim().replace(/^[\-\*]\s+/, '');
                listItems.push({
                    type: 'listItem',
                    content: [{
                            type: 'paragraph',
                            content: parseInlineFormatting(itemText)
                        }]
                });
                i++;
            }
            content.push({
                type: 'bulletList',
                content: listItems
            });
            continue;
        }
        // Ordered list (1. item)
        if (/^\d+\.\s+/.test(line.trim())) {
            const listItems = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
                const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
                listItems.push({
                    type: 'listItem',
                    content: [{
                            type: 'paragraph',
                            content: parseInlineFormatting(itemText)
                        }]
                });
                i++;
            }
            content.push({
                type: 'orderedList',
                content: listItems
            });
            continue;
        }
        // Table (| col | col |)
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            const tableRows = [];
            let isHeader = true;
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                const rowLine = lines[i].trim();
                // Skip separator row (|---|---|)
                if (/^\|[\s\-:]+\|$/.test(rowLine.replace(/\|/g, '|'))) {
                    i++;
                    isHeader = false;
                    continue;
                }
                const cells = rowLine.split('|').slice(1, -1).map(cell => cell.trim());
                const cellType = isHeader ? 'tableHeader' : 'tableCell';
                tableRows.push({
                    type: 'tableRow',
                    content: cells.map(cell => ({
                        type: cellType,
                        content: [{
                                type: 'paragraph',
                                content: parseInlineFormatting(cell)
                            }]
                    }))
                });
                i++;
            }
            if (tableRows.length > 0) {
                content.push({
                    type: 'table',
                    attrs: { isNumberColumnEnabled: false, layout: 'default' },
                    content: tableRows
                });
            }
            continue;
        }
        // Regular paragraph
        const paragraphLines = [line];
        i++;
        // Collect consecutive non-special lines
        while (i < lines.length) {
            const nextLine = lines[i];
            if (nextLine.trim() === '' ||
                /^#{1,6}\s+/.test(nextLine) ||
                /^[\-\*]\s+/.test(nextLine.trim()) ||
                /^\d+\.\s+/.test(nextLine.trim()) ||
                nextLine.trim().startsWith('>') ||
                nextLine.trim().startsWith('```') ||
                nextLine.trim().startsWith('|') ||
                /^(-{3,}|\*{3,}|_{3,})$/.test(nextLine.trim())) {
                break;
            }
            paragraphLines.push(nextLine);
            i++;
        }
        content.push({
            type: 'paragraph',
            content: parseInlineFormatting(paragraphLines.join(' '))
        });
    }
    return {
        type: 'doc',
        version: 1,
        content
    };
}
/**
 * Parse inline formatting (bold, italic, code, links)
 */
function parseInlineFormatting(text) {
    const nodes = [];
    let remaining = text;
    while (remaining.length > 0) {
        // Link [text](url)
        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
            nodes.push({
                type: 'text',
                text: linkMatch[1],
                marks: [{ type: 'link', attrs: { href: linkMatch[2] } }]
            });
            remaining = remaining.slice(linkMatch[0].length);
            continue;
        }
        // Bold and italic ***text*** or ___text___
        const boldItalicMatch = remaining.match(/^(\*{3}|_{3})([^*_]+)\1/);
        if (boldItalicMatch) {
            nodes.push({
                type: 'text',
                text: boldItalicMatch[2],
                marks: [{ type: 'strong' }, { type: 'em' }]
            });
            remaining = remaining.slice(boldItalicMatch[0].length);
            continue;
        }
        // Bold **text** or __text__
        const boldMatch = remaining.match(/^(\*{2}|_{2})([^*_]+)\1/);
        if (boldMatch) {
            nodes.push({
                type: 'text',
                text: boldMatch[2],
                marks: [{ type: 'strong' }]
            });
            remaining = remaining.slice(boldMatch[0].length);
            continue;
        }
        // Italic *text* or _text_
        const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
        if (italicMatch) {
            nodes.push({
                type: 'text',
                text: italicMatch[2],
                marks: [{ type: 'em' }]
            });
            remaining = remaining.slice(italicMatch[0].length);
            continue;
        }
        // Inline code `text`
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
            nodes.push({
                type: 'text',
                text: codeMatch[1],
                marks: [{ type: 'code' }]
            });
            remaining = remaining.slice(codeMatch[0].length);
            continue;
        }
        // Strikethrough ~~text~~
        const strikeMatch = remaining.match(/^~~([^~]+)~~/);
        if (strikeMatch) {
            nodes.push({
                type: 'text',
                text: strikeMatch[1],
                marks: [{ type: 'strike' }]
            });
            remaining = remaining.slice(strikeMatch[0].length);
            continue;
        }
        // Find next special character
        const nextSpecial = remaining.search(/[\[*_`~]/);
        if (nextSpecial === -1) {
            // No more special characters
            if (remaining.length > 0) {
                nodes.push({ type: 'text', text: remaining });
            }
            break;
        }
        else if (nextSpecial === 0) {
            // Special char at start but didn't match patterns - treat as literal
            nodes.push({ type: 'text', text: remaining[0] });
            remaining = remaining.slice(1);
        }
        else {
            // Add text before special character
            nodes.push({ type: 'text', text: remaining.slice(0, nextSpecial) });
            remaining = remaining.slice(nextSpecial);
        }
    }
    return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
}
/**
 * Check if a string looks like it contains Markdown formatting
 */
export function looksLikeMarkdown(text) {
    const markdownPatterns = [
        /^#{1,6}\s+/m, // Headers
        /\*\*[^*]+\*\*/, // Bold
        /\*[^*]+\*/, // Italic
        /`[^`]+`/, // Inline code
        /```/, // Code block
        /^\s*[-*]\s+/m, // Unordered list
        /^\s*\d+\.\s+/m, // Ordered list
        /\[.+\]\(.+\)/, // Links
        /^\|.+\|$/m, // Tables
        /^>/m, // Blockquotes
    ];
    return markdownPatterns.some(pattern => pattern.test(text));
}
