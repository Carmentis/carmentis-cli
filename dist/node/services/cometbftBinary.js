"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometbftBinary = void 0;
const binaryHandler_1 = require("./binaryHandler");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
class CometbftBinary {
    static isGoInstalled() {
        return binaryHandler_1.BinaryHandler.isBinaryAvailable("go");
    }
    static isCometBFTInstalled() {
        return binaryHandler_1.BinaryHandler.isBinaryAvailable("cometbft");
    }
    static executeInit(home, executeInDocker = true) {
        if (executeInDocker) {
            // we ensure the provided home is a folder (or create it if not exists)
            const resolvedPath = path_1.default.resolve(home);
            if (!fs_1.default.existsSync(resolvedPath)) {
                fs_1.default.mkdirSync(resolvedPath, { recursive: true });
                console.log(`📁 Folder created : ${resolvedPath}`);
            }
            const dockerArgs = [
                'run',
                '--rm',
                '-v', `${resolvedPath}:/cometbft`,
                '-u', "1000",
                'cometbft/cometbft',
                'init'
            ];
            const result = (0, child_process_1.spawnSync)('docker', dockerArgs, { stdio: 'inherit' });
            if (result.error) {
                console.error('Error during docker execution :', result.error);
                process.exit(1);
            }
            //BinaryHandler.execute(`docker run -v ${resolvedPath}:/cometbft -u $UID cometbft/cometbft init`, false );
        }
        else {
            binaryHandler_1.BinaryHandler.execute(`cometbft init --home ${home}`);
        }
    }
}
exports.CometbftBinary = CometbftBinary;
