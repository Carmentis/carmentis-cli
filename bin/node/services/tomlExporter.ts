import * as fs from 'node:fs/promises';
import { dirname } from 'node:path';
import * as toml from '@iarna/toml';

export class TomlExporter {
    static async exportToFile(object: Record<string, any>, outputPath: string): Promise<void> {
        await fs.mkdir(dirname(outputPath), { recursive: true }).catch(() => {});
        const content = toml.stringify(object as any);
        await fs.writeFile(outputPath, content, 'utf8');
    }
}
