import * as fs from 'fs';
import * as pathModule from 'path';

export class JsonExporter {
    static exportAt(object: object, path: string) {
        // Ensure the directory exists
        const dir = pathModule.dirname(path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write the JSON object to file (pretty-printed)
        fs.writeFileSync(path, JSON.stringify(object, null, 2), 'utf-8');
    }
}
