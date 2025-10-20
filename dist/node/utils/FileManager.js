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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManager = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
class FileManager {
    static async ensureDirExistsOrCreate(directory) {
        await promises_1.default.mkdir(directory, { recursive: true });
    }
    static async writeFile(content, path) {
        // Ensure destination directory exists
        const { dirname } = await Promise.resolve().then(() => __importStar(require('path')));
        const dir = dirname(path);
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
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
    static async replaceInFile(filePath, target, replacement) {
        try {
            // Read file content
            const originalContent = await promises_1.default.readFile(filePath, 'utf8');
            // Replace all occurrences
            const updatedContent = originalContent.split(target).join(replacement);
            // Write back to file only if changes were made
            if (originalContent !== updatedContent) {
                await promises_1.default.writeFile(filePath, updatedContent, 'utf8');
            }
        }
        catch (error) {
            console.error(`Failed to replace content in file "${filePath}":`, error);
            throw error;
        }
    }
    static async readFile(filePath) {
        try {
            return await promises_1.default.readFile(filePath, 'utf8');
        }
        catch (error) {
            console.error(`Failed to read content from file "${filePath}":`, error);
            throw error;
        }
    }
    static async deleteDir(dirPath) {
        try {
            console.log(`Delete directory ${dirPath}`);
            return await promises_1.default.rm(dirPath, { recursive: true });
        }
        catch (error) {
            console.error(`Failed to delete folder "${dirPath}":`, error);
            throw error;
        }
    }
}
exports.FileManager = FileManager;
