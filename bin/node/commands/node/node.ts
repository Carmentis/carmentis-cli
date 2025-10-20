import commander from "commander";
import {InitNodeConfigCommand} from "./init";

export class NodeCommand {
    register(program: commander.Command) {
        const nodeCommand = program
            .command('node')
            .description("Command for Carmentis node");


        // register additional commands
        new InitNodeConfigCommand().register(nodeCommand)
    }
}
