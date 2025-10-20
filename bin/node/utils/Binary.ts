import { execSync } from 'child_process';
import * as querystring from 'node:querystring';

export class Binary {
    static isBinaryAvailable(binary: string): boolean {
        try {
            execSync(`which ${binary}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    static execute(command: string, ignoreIo: boolean = true) {
        try {
            console.log(`Running ${command}`);
            execSync(`${command}`, { stdio: ignoreIo ? 'ignore' : 'inherit' });
            return true;
        } catch {
            return false;
        }
    }
}
