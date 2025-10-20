import * as fs from 'fs';

export class JsonEditor {
    constructor(private readonly path: string) {}

    write(propertyPath: string[], value: string) {
        // Step 1: Read the file
        const raw = fs.readFileSync(this.path, 'utf-8');
        const json = JSON.parse(raw);

        // Step 2: Navigate and update the property
        let current = json;
        for (let i = 0; i < propertyPath.length - 1; i++) {
            const key = propertyPath[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        // Step 3: Set the final value
        current[propertyPath[propertyPath.length - 1]] = value;

        // Step 4: Write back to the file (pretty-printed)
        fs.writeFileSync(this.path, JSON.stringify(json, null, 2), 'utf-8');
    }
}
