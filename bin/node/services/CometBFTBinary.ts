import { Binary } from '../utils/Binary';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {FileManager} from "../utils/FileManager";
import * as os from 'os';


export class CometBFTBinary {
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
                '-u', `${os.userInfo().uid.toString()}:${os.userInfo().gid.toString()}`,
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