import { BinaryHandler } from './binaryHandler';

export class CometbftBinary {
    static isGoInstalled() : boolean {
        return BinaryHandler.isBinaryAvailable("go");
    }

    static isCometBFTInstalled(): boolean {
        return BinaryHandler.isBinaryAvailable("cometbft");
    }

    static executeInit(home: string) {
        BinaryHandler.execute(`cometbft init --home ${home}`);
    }
}