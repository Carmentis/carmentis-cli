import {FileManager} from "./FileManager";

export class FileDownloader {
    static async downloadAt(url: string, storeAt: string) {
        console.log("🌐 Downloading " + url + "...");
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
        }
        let content = await res.text();
        await FileManager.writeFile(content, storeAt)
        console.log(`📄 File downloaded : ${url} -> ${storeAt}`);
    }
}