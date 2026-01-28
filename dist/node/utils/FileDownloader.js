"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDownloader = void 0;
const FileManager_1 = require("./FileManager");
class FileDownloader {
    static async downloadAt(url, storeAt) {
        console.log("🌐 Downloading " + url + "...");
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
        }
        let content = await res.text();
        await FileManager_1.FileManager.writeFile(content, storeAt);
        console.log(`📄 File downloaded : ${url} -> ${storeAt}`);
    }
}
exports.FileDownloader = FileDownloader;
