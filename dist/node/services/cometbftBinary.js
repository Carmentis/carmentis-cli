"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometbftBinary = void 0;
const binaryHandler_1 = require("./binaryHandler");
class CometbftBinary {
    static isGoInstalled() {
        return binaryHandler_1.BinaryHandler.isBinaryAvailable("go");
    }
    static isCometBFTInstalled() {
        return binaryHandler_1.BinaryHandler.isBinaryAvailable("cometbft");
    }
    static executeInit(home) {
        binaryHandler_1.BinaryHandler.execute(`cometbft init --home ${home}`);
    }
}
exports.CometbftBinary = CometbftBinary;
