import { BinaryHandler } from './binaryHandler';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export class CometbftBinary {
    static isGoInstalled() : boolean {
        return BinaryHandler.isBinaryAvailable("go");
    }

    static isCometBFTInstalled(): boolean {
        return BinaryHandler.isBinaryAvailable("cometbft");
    }

    static executeInit(home: string, executeInDocker: boolean = true) {
        if (executeInDocker) {
            // we ensure the provided home is a folder (or create it if not exists)
            const resolvedPath = path.resolve(home);
            if (!fs.existsSync(resolvedPath)) {
                fs.mkdirSync(resolvedPath, { recursive: true });
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

            const result = spawnSync('docker', dockerArgs, { stdio: 'inherit' });

            if (result.error) {
                console.error('Error during docker execution :', result.error);
                process.exit(1);
            }
            //BinaryHandler.execute(`docker run -v ${resolvedPath}:/cometbft -u $UID cometbft/cometbft init`, false );
        } else {
            BinaryHandler.execute(`cometbft init --home ${home}`);
        }
    }
}