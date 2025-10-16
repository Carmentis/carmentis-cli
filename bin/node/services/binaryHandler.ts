import { execSync } from 'child_process';
import * as querystring from 'node:querystring';

export class BinaryHandler {
    static isBinaryAvailable(binary: string): boolean {
        try {
            execSync(`which ${binary}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    static execute(command: string) {
        try {
            console.log(`Running ${command}`);
            execSync(`${command}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
}
