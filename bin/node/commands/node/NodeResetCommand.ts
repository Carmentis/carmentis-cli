import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {confirm} from "@inquirer/prompts";
import {FileManager} from "../../utils/FileManager";
import {Binary} from "../../utils/Binary";
import path from "node:path";
import fs from "node:fs";

export class NodeResetCommand {
    static register(program: commander.Command) {
        program
            .command('reset')
            .description('Reset the node (delete all the data)')
            .option('--home <home>', 'Path where config files have been generated', '.')
            .option('-f,--force', 'Force the reset without confirmation')
            .action(async (options) =>  {
                await SafeCommandRunner.safeRun(async () => {
                    // resolve the current path
                    const homePath = path.resolve(options.home);
                    const abciPath = path.join(homePath, 'abci');
                    const cometbftPath = path.join(homePath, 'cometbft');

                    // check if abci folder exists
                    const abciExists = fs.existsSync(abciPath);

                    // check if cometbft folder exists
                    const cometbftExists = fs.existsSync(cometbftPath);
                    if (!abciExists && !cometbftExists) {
                        console.log('No data to reset. Both ABCI and CometBFT data directories are missing.');
                        return;
                    }

                    console.log('');
                    console.log('⚠️  WARNING: This operation will permanently delete node data.');
                    console.log('⚠️  This command is intended for development and testing environments and replicator nodes only.');
                    console.log('⚠️  Do NOT run this command on a production validator.');
                    console.log('');

                    console.log('The following actions will be performed:');

                    if (abciExists) {
                        console.log(`  • Delete ABCI data directory: ${abciPath}`);
                    }

                    if (cometbftExists) {
                        console.log(`  • Reset CometBFT state: ${cometbftPath}`);
                        console.log(`    (cometbft unsafe-reset-all --home ${cometbftPath})`);
                    }

                    console.log('');

                    const confirmed = options.force || await confirm({
                        message: [
                            'This operation is irreversible.',
                            'All data will be lost.',
                            '',
                            `Target node: ${homePath}`,
                            '',
                            'Continue?'
                        ].join('\n'),
                        default: false,
                    });

                    if (!confirmed) {
                        console.log('Operation cancelled.');
                        return;
                    }

                    // delete abci folder if it exists
                    if (abciExists) {
                        await FileManager.deleteDir(abciPath);
                    }

                    // execute cometbft unsafe-reset-all if cometbft folder exists
                    if (cometbftExists) {
                        const cometbftHome = cometbftPath;
                        const uid = process.env.UID || '1000';
                        const dockerCommand = `docker run --rm -u ${uid} -v ${cometbftHome}:/cometbft cometbft/cometbft:v0.38.x unsafe-reset-all --home /cometbft`;

                        console.log('Executing cometbft unsafe-reset-all...');
                        const success = Binary.execute(dockerCommand, false);

                        if (!success) {
                            console.error('Failed to execute cometbft unsafe-reset-all');
                            return;
                        }
                    }

                    console.log('✅ Node reset completed successfully');
                })
            })
    }
}
