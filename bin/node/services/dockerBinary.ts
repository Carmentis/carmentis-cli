import { BinaryHandler } from './binaryHandler';

export class DockerBinary {
    static isDockerInstalled() {
        return BinaryHandler.isBinaryAvailable('docker');
    }

}