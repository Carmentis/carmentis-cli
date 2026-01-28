"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DotEnvExporter = void 0;
const FileManager_1 = require("./FileManager");
class DotEnvExporter {
    /**
     * Exports a config object to a .env file
     * @param config An object containing key-value pairs to write into the .env file
     * @param exportAt The file path where the .env content should be written
     */
    static async exportToFile(config, exportAt) {
        try {
            // Create .env lines
            const lines = Object.entries(config).map(([key, value]) => {
                // Escape values containing spaces or quotes
                const escapedValue = value.includes(' ') || value.includes('"')
                    ? `"${value.replace(/"/g, '\\"')}"`
                    : value;
                return `${key}=${escapedValue}`;
            });
            const content = lines.join('\n') + '\n';
            await FileManager_1.FileManager.writeFile(content, exportAt);
        }
        catch (error) {
            console.error(`Failed to write .env file:`, error);
            throw error;
        }
    }
}
exports.DotEnvExporter = DotEnvExporter;
