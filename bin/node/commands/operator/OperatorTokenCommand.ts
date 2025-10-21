import commander from "commander";
import {SafeCommandRunner} from "../safeCommandRunner";
import path from "node:path";
import {FileManager} from "../../utils/FileManager";

export class OperatorTokenCommand {
    register(program: commander.Command) {
        program
            .command('token')
            .description("Show the initial admin creation token")
            .option('--home <home>', 'Path where config files have been generated', '.')
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {
                    const configPath =  path.resolve(options.home);
                    const adminTokenFile = path.join(configPath, 'operator-storage', 'admin-token.txt');
                    const content = await FileManager.readFile(adminTokenFile);
                    console.log(content);
                })
            })
    }
}