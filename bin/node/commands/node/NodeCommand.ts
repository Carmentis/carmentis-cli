import commander from "commander";
import {NodeInitConfigCommand} from "./NodeInitConfigCommand";
import {NodeResetCommand} from "./NodeResetCommand";
import {NodeCheckUpdateCommand} from "./NodeCheckUpdateCommand";
import {NodeInspectCommand} from "./NodeInspectCommand";
import {NodeAbciCommand} from "./abci/NodeAbciCommand";

export class NodeCommand {
    static register(program: commander.Command) {
        const nodeCommand = program
            .command('node')
            .description("Command for Carmentis node");


        // register additional commands
        NodeAbciCommand.register(nodeCommand)
        NodeInitConfigCommand.register(nodeCommand)
        NodeResetCommand.register(nodeCommand)
        NodeCheckUpdateCommand.register(nodeCommand)
        NodeInspectCommand.register(nodeCommand)
    }
}
