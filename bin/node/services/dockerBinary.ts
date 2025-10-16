import { BinaryHandler } from './binaryHandler';

export class DockerBinary {
    static isDockerInstalled() {
        return BinaryHandler.isBinaryAvailable('docker');
    }

    static async runComposeDown() {
        BinaryHandler.execute("docker compose down", false)
    }

    static async runComposeUp() {
        BinaryHandler.execute("docker compose up -d", false)
    }

    static async runComposeLogs() {
        BinaryHandler.execute("docker compose logs", false)
    }
}