"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerBinary = void 0;
const Binary_1 = require("./Binary");
class DockerBinary {
    static isDockerInstalled() {
        return Binary_1.Binary.isBinaryAvailable('docker');
    }
    static async runComposeDown() {
        Binary_1.Binary.execute("docker compose down", false);
    }
    static async runComposeUp() {
        Binary_1.Binary.execute("docker compose up -d", false);
    }
    static async runComposeLogs() {
        Binary_1.Binary.execute("docker compose logs", false);
    }
}
exports.DockerBinary = DockerBinary;
