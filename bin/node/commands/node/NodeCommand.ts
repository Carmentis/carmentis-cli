import commander from "commander";
import {NodeInitConfigCommand} from "./NodeInitConfigCommand";

export class NodeCommand {
    static register(program: commander.Command) {
        const nodeCommand = program
            .command('node')
            .description("Command for Carmentis node");


        // register additional commands
        NodeInitConfigCommand.register(nodeCommand)
    }
}
