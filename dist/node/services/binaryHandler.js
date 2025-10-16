"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryHandler = void 0;
const child_process_1 = require("child_process");
class BinaryHandler {
    static isBinaryAvailable(binary) {
        try {
            (0, child_process_1.execSync)(`which ${binary}`, { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
    static execute(command) {
        try {
            console.log(`Running ${command}`);
            (0, child_process_1.execSync)(`${command}`, { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.BinaryHandler = BinaryHandler;
