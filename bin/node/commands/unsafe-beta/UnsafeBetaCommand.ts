import commander from "commander";
import {GenAbciConfigCommand} from "./GenAbciConfigCommand";
import {GenDockerComposeCommand} from "./GenDockerComposeCommand";

export class UnsafeBetaCommand {
    static register(program: commander.Command) {
        const unsafeBetaCommand = program
            .command('unsafe-beta')
            .description("Commands still in testing (use at your own risk)");

        // register sub-commands
        GenAbciConfigCommand.register(unsafeBetaCommand);
        GenDockerComposeCommand.register(unsafeBetaCommand);
    }
}
