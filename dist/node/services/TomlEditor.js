"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TomlEditor = void 0;
const fs = __importStar(require("fs"));
/**
 * This TOML editor class allows one to edit a field without removing all the comments from the file.
 * It is particularly useful to perform precise modifications of the file.
 */
class TomlEditor {
    constructor(path) {
        this.path = path;
    }
    write(key, value, section) {
        if (key === undefined || value === undefined || value === undefined) {
            throw new Error(`Cannot write undefined key ${key} or undefined value ${value}`);
        }
        const exists = fs.existsSync(this.path);
        const original = exists ? fs.readFileSync(this.path, 'utf8') : '';
        const eol = original.includes('\r\n') ? '\r\n' : '\n';
        const lines = (original.length > 0 ? original.split(/\r?\n/) : []);
        const formattedValue = this.formatValue(value);
        const keyPattern = new RegExp(`^\\s*${this.escapeRegex(key)}\\s*=\\s*`);
        // Helper to find inline comment start index not within quotes
        const findCommentIndex = (line) => {
            let inQuote = false;
            let escape = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (escape) {
                    escape = false;
                    continue;
                }
                if (ch === '\\') {
                    escape = true;
                    continue;
                }
                if (ch === '"') {
                    inQuote = !inQuote;
                    continue;
                }
                if (!inQuote && ch === '#')
                    return i;
            }
            return -1;
        };
        const replaceLineValue = (line) => {
            const commentIdx = findCommentIndex(line);
            const beforeComment = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
            const afterComment = commentIdx >= 0 ? line.slice(commentIdx) : '';
            const match = beforeComment.match(/^(\s*)([^=]+?)(\s*=\s*)(.*)$/);
            if (!match)
                return `${line}`; // fallback
            const leading = match[1] || '';
            const left = match[2].trimEnd();
            const eq = match[3] || '=';
            const trailing = afterComment ? ' ' : ''; // keep a space before comment if there is one
            return `${leading}${left}${eq}${formattedValue}${trailing}${afterComment}`;
        };
        const insertKeyLine = (indent = '') => `${indent}${key} = ${formattedValue}`;
        // If section specified, try to locate it
        if (section && section.trim().length > 0) {
            const sectionHeaderPattern = new RegExp(`^\\s*\\[\\s*${this.escapeRegex(section)}\\s*\\]\\s*$`);
            let sectionStart = -1;
            for (let i = 0; i < lines.length; i++) {
                if (sectionHeaderPattern.test(lines[i])) {
                    sectionStart = i;
                    break;
                }
            }
            if (sectionStart === -1) {
                // Append the section and key at the end
                const newLines = [];
                if (lines.length > 0 && lines[lines.length - 1].trim() !== '')
                    newLines.push('');
                newLines.push(`[${section}]`);
                newLines.push(insertKeyLine());
                const updated = lines.concat(newLines).join(eol) + eol;
                fs.writeFileSync(this.path, updated, 'utf8');
                return;
            }
            // Find end of section (next section header or end of file)
            const anySectionHeader = /^\s*\[.*\]\s*$/;
            let sectionEnd = lines.length; // exclusive
            for (let i = sectionStart + 1; i < lines.length; i++) {
                if (anySectionHeader.test(lines[i])) {
                    sectionEnd = i;
                    break;
                }
            }
            // Search for key within section
            for (let i = sectionStart + 1; i < sectionEnd; i++) {
                const line = lines[i];
                if (line.trim().startsWith('#'))
                    continue; // skip pure comment lines
                if (keyPattern.test(line)) {
                    lines[i] = replaceLineValue(line);
                    const updated = lines.join(eol) + eol;
                    fs.writeFileSync(this.path, updated, 'utf8');
                    return;
                }
            }
            // Not found -> insert before sectionEnd, maintaining at least one line before next section if needed
            const indent = this.detectIndentation(lines, sectionStart + 1, sectionEnd) || '';
            lines.splice(sectionEnd, 0, insertKeyLine(indent));
            const updated = lines.join(eol) + eol;
            fs.writeFileSync(this.path, updated, 'utf8');
            return;
        }
        // No section: operate at top-level (before first section header)
        const firstSectionIdx = lines.findIndex(l => /^\s*\[.*\]\s*$/.test(l));
        const topStart = 0;
        const topEnd = firstSectionIdx === -1 ? lines.length : firstSectionIdx;
        for (let i = topStart; i < topEnd; i++) {
            const line = lines[i];
            if (line.trim().startsWith('#'))
                continue;
            if (keyPattern.test(line)) {
                lines[i] = replaceLineValue(line);
                const updated = lines.join(eol) + (lines.length ? eol : '');
                fs.writeFileSync(this.path, updated, 'utf8');
                return;
            }
        }
        // Not found at top-level -> insert before first section or at end if no sections
        const insertAt = topEnd;
        // If inserting at 0 and file exists with content, avoid adding extra leading blank line
        if (insertAt > 0 && lines[insertAt - 1].trim() !== '') {
            lines.splice(insertAt, 0, insertKeyLine());
        }
        else {
            lines.splice(insertAt, 0, insertKeyLine());
        }
        const updated = lines.join(eol) + eol;
        fs.writeFileSync(this.path, updated, 'utf8');
    }
    escapeRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`);
    }
    detectIndentation(lines, start, end) {
        for (let i = start; i < end; i++) {
            const line = lines[i];
            if (!line.trim())
                continue;
            if (line.trim().startsWith('#'))
                continue;
            const m = line.match(/^(\s+)/);
            if (m)
                return m[1];
            return '';
        }
        return '';
    }
    formatValue(value) {
        if (typeof value === 'boolean')
            return value ? 'true' : 'false';
        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                throw new Error('TomlEditor: numeric value must be a finite number');
            }
            return value.toString();
        }
        if (Array.isArray(value)) {
            const items = value.map(v => this.formatString(v));
            return `[ ${items.join(', ')} ]`;
        }
        return this.formatString(value);
    }
    formatString(v) {
        // Use TOML basic string with escaping
        const escaped = v
            .replace(/\\/g, '\\\\')
            .replace(/\"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return `"${escaped}"`;
    }
}
exports.TomlEditor = TomlEditor;
