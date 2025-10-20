import { Binary } from './Binary';

export class DockerBinary {
    static isDockerInstalled() {
        return Binary.isBinaryAvailable('docker');
    }

    static async runComposeDown() {
        Binary.execute("docker compose down", false)
    }

    static async runComposeUp() {
        Binary.execute("docker compose up -d", false)
    }

    static async runComposeLogs() {
        Binary.execute("docker compose logs", false)
    }
}