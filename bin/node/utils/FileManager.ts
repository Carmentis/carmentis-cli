import fs from "node:fs/promises";

export class FileManager {
    static async ensureDirExistsOrCreate(directory: string) {
        await fs.mkdir(directory, { recursive: true });
    }

    static async writeFile(content: string, path: string) {
        // Ensure destination directory exists
        const { dirname } = await import('path');
        const dir = dirname(path);
        const fs = await import('fs/promises');
        await fs.mkdir(dir, { recursive: true });
        // Write file
        await fs.writeFile(path, content, { encoding: 'utf8' });
    }

    /**
     * Replaces all occurrences of a target string with a replacement in the specified file.
     * @param filePath The path of the file to update.
     * @param target The content to be replaced.
     * @param replacement The new content to insert.
     */
    static async replaceInFile(filePath: string, target: string, replacement: string): Promise<void> {
        try {
            // Read file content
            const originalContent = await fs.readFile(filePath, 'utf8');

            // Replace all occurrences
            const updatedContent = originalContent.split(target).join(replacement);

            // Write back to file only if changes were made
            if (originalContent !== updatedContent) {
                await fs.writeFile(filePath, updatedContent, 'utf8');
            }
        } catch (error) {
            console.error(`Failed to replace content in file "${filePath}":`, error);
            throw error;
        }
    }

    static async readFile(filePath: string) {
        try {
            return await fs.readFile(filePath, 'utf8')
        } catch (error) {
            console.error(`Failed to read content from file "${filePath}":`, error);
            throw error;
        }
    }

    static async deleteDir(dirPath: string) {
        try {
            console.log(`Delete directory ${dirPath}`);
            return await fs.rm(dirPath, { recursive: true });
        } catch (error) {
            console.error(`Failed to delete folder "${dirPath}":`, error);
            throw error;
        }
    }
}