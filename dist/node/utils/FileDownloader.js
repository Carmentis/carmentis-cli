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
exports.FileDownloader = void 0;
const FileManager_1 = require("./FileManager");
class FileDownloader {
    /**
     * Download the featured docker-compose.yml for Caddy and save it at the given filesystem path.
     * - Ensures parent directory exists
     * - Converts GitHub "blob" URL to a raw URL for correct file contents
     */
    static async downloadCaddyFeaturedComposeAt(path) {
        const toRawGithub = (url) => {
            // Convert: https://github.com/{org}/{repo}/blob/{branch}/{path}
            // To:      https://raw.githubusercontent.com/{org}/{repo}/{branch}/{path}
            const match = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i);
            if (!match)
                return url; // If not a blob URL, return as-is
            const [, org, repo, branch, rest] = match;
            return `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${rest}`;
        };
        const url = toRawGithub(this.CADDY_FEATURED_COMPOSE_ENDPOINT);
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to download docker-compose from ${url}: ${res.status} ${res.statusText}`);
        }
        const content = await res.text();
        // Ensure destination directory exists
        const { dirname } = await Promise.resolve().then(() => __importStar(require('path')));
        const dir = dirname(path);
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        await fs.mkdir(dir, { recursive: true });
        // Write file
        await fs.writeFile(path, content, { encoding: 'utf8' });
    }
    /**
     *
     * @param path
     * @param newNodeEndpoint The endpoint used instead of the default 'node.your-domain-name' domain name.
     */
    static async downloadCaddyFileAt(path, newNodeEndpoint) {
        const toRawGithub = (url) => {
            const match = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i);
            if (!match)
                return url;
            const [, org, repo, branch, rest] = match;
            return `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${rest}`;
        };
        const url = toRawGithub(this.CADDYFILE_ENDPOINT);
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to download Caddyfile from ${url}: ${res.status} ${res.statusText}`);
        }
        let content = await res.text();
        // Replace placeholder domain with provided endpoint
        const placeholder = 'node.your-domain-name';
        if (newNodeEndpoint && typeof newNodeEndpoint === 'string') {
            const safeEndpoint = newNodeEndpoint.trim();
            if (safeEndpoint) {
                const re = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                content = content.replace(re, safeEndpoint);
            }
        }
        // Ensure destination directory exists
        const { dirname } = await Promise.resolve().then(() => __importStar(require('path')));
        const dir = dirname(path);
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        await fs.mkdir(dir, { recursive: true });
        // Write file
        await fs.writeFile(path, content, { encoding: 'utf8' });
    }
    static async downloadAt(url, storeAt) {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
        }
        let content = await res.text();
        await FileManager_1.FileManager.writeFile(content, storeAt);
    }
}
exports.FileDownloader = FileDownloader;
FileDownloader.CADDY_FEATURED_COMPOSE_ENDPOINT = 'https://github.com/Carmentis/architectures/blob/main/node/docker-compose-with-caddy.yml';
FileDownloader.CADDYFILE_ENDPOINT = 'https://github.com/Carmentis/architectures/blob/main/node/Caddyfile';
