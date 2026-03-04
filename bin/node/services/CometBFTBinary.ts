import { Binary } from '../utils/Binary';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {FileManager} from "../utils/FileManager";

export class CometBFTBinary {
    static isGoInstalled() : boolean {
        return Binary.isBinaryAvailable("go");
    }

    static isCometBFTInstalled(): boolean {
        return Binary.isBinaryAvailable("cometbft");
    }

    static executeInit(home: string, executeInDocker: boolean = true) {
        if (executeInDocker) {
            // we ensure the provided home is a folder (or create it if not exists)
            const resolvedPath = path.resolve(home);
            if (!fs.existsSync(resolvedPath)) {
                FileManager.ensureDirExistsOrCreate(resolvedPath);
            }

            const dockerArgs = [
                'run',
                '--rm',
                '-v', `${resolvedPath}:/cometbft`,
                '-u', process.env.UID || "1000",
                'cometbft/cometbft:v0.38.x',
                'init'
            ];

            const result = spawnSync('docker', dockerArgs, { stdio: 'inherit' });

            if (result.error) {
                console.error('Error during docker execution :', result.error);
                process.exit(1);
            }
            //BinaryHandler.execute(`docker run -v ${resolvedPath}:/cometbft -u $UID cometbft/cometbft init`, false );
        } else {
            Binary.execute(`cometbft init --home ${home}`);
        }
    }
}