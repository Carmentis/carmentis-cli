"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerBinary = void 0;
const binaryHandler_1 = require("./binaryHandler");
class DockerBinary {
    static isDockerInstalled() {
        return binaryHandler_1.BinaryHandler.isBinaryAvailable('docker');
    }
}
exports.DockerBinary = DockerBinary;
