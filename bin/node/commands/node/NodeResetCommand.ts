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
                        console.log('No data to reset. Both abci and cometbft folders do not exist.');
                        return;
                    }

                    // display what will be done
                    console.log('The following actions will be performed:');
                    if (abciExists) {
                        console.log(`  - Delete folder: ${abciPath}`);
                    }
                    if (cometbftExists) {
                        console.log(`  - Execute: cometbft unsafe-reset-all --home ${cometbftPath}`);
                    }

                    const confirmed = options.force || await confirm({
                        message: `Are you sure you want to reset the node at ${homePath}?`,
                        default: false
                    });

                    if (!confirmed) {
                        console.log('Reset not confirmed, aborting');
                        return;
                    }

                    // delete abci folder if it exists
                    if (abciExists) {
                        await FileManager.deleteDir(abciPath);
                    }

                    // execute cometbft unsafe-reset-all if cometbft folder exists
                    if (cometbftExists) {
                        const cometbftHome = cometbftPath;
                        const dockerCommand = `docker run --rm -v ${cometbftHome}:/cometbft cometbft/cometbft:latest unsafe-reset-all --home /cometbft`;

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
