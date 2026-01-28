"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometBFTBinary = void 0;
const Binary_1 = require("../utils/Binary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const FileManager_1 = require("../utils/FileManager");
class CometBFTBinary {
    static isGoInstalled() {
        return Binary_1.Binary.isBinaryAvailable("go");
    }
    static isCometBFTInstalled() {
        return Binary_1.Binary.isBinaryAvailable("cometbft");
    }
    static executeInit(home, executeInDocker = true) {
        if (executeInDocker) {
            // we ensure the provided home is a folder (or create it if not exists)
            const resolvedPath = path_1.default.resolve(home);
            if (!fs_1.default.existsSync(resolvedPath)) {
                FileManager_1.FileManager.ensureDirExistsOrCreate(resolvedPath);
            }
            const dockerArgs = [
                'run',
                '--rm',
                '-v', `${resolvedPath}:/cometbft`,
                '-u', "1000",
                'cometbft/cometbft:v0.38.x',
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
            Binary_1.Binary.execute(`cometbft init --home ${home}`);
        }
    }
}
exports.CometBFTBinary = CometBFTBinary;
