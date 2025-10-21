"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Binary = void 0;
const child_process_1 = require("child_process");
class Binary {
    static isBinaryAvailable(binary) {
        try {
            (0, child_process_1.execSync)(`which ${binary}`, { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
    static execute(command, ignoreIo = true) {
        try {
            console.log(`Running ${command}`);
            (0, child_process_1.execSync)(`${command}`, { stdio: ignoreIo ? 'ignore' : 'inherit' });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.Binary = Binary;
