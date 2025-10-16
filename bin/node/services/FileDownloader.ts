export class FileDownloader {
    private static CADDY_FEATURED_COMPOSE_ENDPOINT = 'https://github.com/Carmentis/architectures/blob/main/node/docker-compose-with-caddy.yml';
    private static CADDYFILE_ENDPOINT = 'https://github.com/Carmentis/architectures/blob/main/node/Caddyfile'
    /**
     * Download the featured docker-compose.yml for Caddy and save it at the given filesystem path.
     * - Ensures parent directory exists
     * - Converts GitHub "blob" URL to a raw URL for correct file contents
     */
    static async downloadCaddyFeaturedComposeAt(path: string): Promise<void> {
        const toRawGithub = (url: string): string => {
            // Convert: https://github.com/{org}/{repo}/blob/{branch}/{path}
            // To:      https://raw.githubusercontent.com/{org}/{repo}/{branch}/{path}
            const match = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i);
            if (!match) return url; // If not a blob URL, return as-is
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
        const { dirname } = await import('path');
        const dir = dirname(path);
        const fs = await import('fs/promises');
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(path, content, { encoding: 'utf8' });
    }

    /**
     * 
     * @param path
     * @param newNodeEndpoint The endpoint used instead of the default 'node.your-domain-name' domain name.
     */
    static async downloadCaddyFileAt(path: string, newNodeEndpoint: string): Promise<void> {
        const toRawGithub = (url: string): string => {
            const match = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i);
            if (!match) return url;
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
        const { dirname } = await import('path');
        const dir = dirname(path);
        const fs = await import('fs/promises');
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(path, content, { encoding: 'utf8' });
    }
}