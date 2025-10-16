"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerBinary = void 0;
const binaryHandler_1 = require("./binaryHandler");
class DockerBinary {
    static isDockerInstalled() {
        return binaryHandler_1.BinaryHandler.isBinaryAvailable('docker');
    }
    static async runComposeDown() {
        binaryHandler_1.BinaryHandler.execute("docker compose down", false);
    }
    static async runComposeUp() {
        binaryHandler_1.BinaryHandler.execute("docker compose up -d", false);
    }
    static async runComposeLogs() {
        binaryHandler_1.BinaryHandler.execute("docker compose logs", false);
    }
}
exports.DockerBinary = DockerBinary;
