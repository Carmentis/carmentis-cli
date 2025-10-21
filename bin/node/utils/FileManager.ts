import fs from "node:fs";

export class FileManager {
    static ensureDirExistsOrCreate(directory: string) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`📁 Folder created : ${directory}`);
    }

    static async writeFile(content: string, path: string) {
        // Ensure destination directory exists
        const { dirname } = await import('path');
        const dir = dirname(path);
        const fs = await import('fs/promises');
        await fs.mkdir(dir, { recursive: true });
        // Write file
        await fs.writeFile(path, content, { encoding: 'utf8' });
        console.log(`📄 File updated : ${path}`);
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
            const originalContent = fs.readFileSync(filePath, 'utf8');

            // Replace all occurrences
            const updatedContent = originalContent.split(target).join(replacement);

            // Write back to file only if changes were made
            if (originalContent !== updatedContent) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`📄 File updated : ${filePath}`);
            }
        } catch (error) {
            console.error(`Failed to replace content in file "${filePath}":`, error);
            throw error;
        }
    }

    static async readFile(filePath: string) {
        try {
            return fs.readFileSync(filePath, 'utf8')
        } catch (error) {
            console.error(`Failed to read content from file "${filePath}":`, error);
            throw error;
        }
    }

    static async deleteDir(dirPath: string) {
        try {
            fs.rmSync(dirPath, { recursive: true });
            console.log(`📁 Folder deleted : ${dirPath}`);
        } catch (error) {
            console.error(`Failed to delete folder "${dirPath}":`, error);
            throw error;
        }
    }
}