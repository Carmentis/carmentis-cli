
import {SafeCommandRunner} from "../../safeCommandRunner";
import path from "node:path";
import {AbciConfigGenerator} from "../../../services/AbciConfigGenerator";
import commander from "commander";
import {NodeAbciInitConfigCommand} from "./NodeAbciInitConfigCommand";

export class NodeAbciCommand {
    static register(program: commander.Command) {
        const nodeCommand = program
            .command('abci')
            .description("ABCI-related commands for Carmentis node");


        // register additional commands
        NodeAbciInitConfigCommand.register(nodeCommand)
    }
}