import commander from "commander";
import {InitConfigCommand} from "./node/init";

export class NodeCommand {
    register(program: commander.Command) {
        const nodeCommand = program
            .command('node')
            .description("Command to handle Carmentis node");


        // register additional commands
        new InitConfigCommand().register(nodeCommand)
    }
}
