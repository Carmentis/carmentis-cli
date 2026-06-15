import commander from "commander";
import {GenDockerComposeCommand} from "./GenDockerComposeCommand";
import {ConvertTokenCommand} from "./ConvertTokenCommand";

export class UnsafeBetaCommand {
    static register(program: commander.Command) {
        const unsafeBetaCommand = program
            .command('unsafe-beta')
            .description("Commands still in testing (use at your own risk)");

        // register sub-commands
        GenDockerComposeCommand.register(unsafeBetaCommand);
        ConvertTokenCommand.register(unsafeBetaCommand);
    }
}
