import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import {confirm} from "@inquirer/prompts";
import {FileManager} from "../../utils/FileManager";
import path from "node:path";

export class OperatorUnsafeReset {
    register(program: commander.Command) {
        program
            .command('unsafe-reset')
            .description('Reset the operator (delete all the data)')
            .option('--home <home>', 'Path where config files have been generated', '.')
            .option('-f,--force', 'Force the deletion of the data')
            .action(async (options) =>  {
                await SafeCommandRunner.safeRun(async () => {
                    const confirmed = options.force || await confirm({
                        message: 'Are you sure to proceed?',
                        default: false
                    });
                    if (confirmed) {
                        // resolve the current path
                        const homePath = path.resolve(options.home);
                        const storagePath = path.join(homePath, 'operator-storage')
                        await FileManager.deleteDir(storagePath)
                    } else {
                        console.log('Reset not confirmed, aborting')
                    }
                })
            })
    }
}