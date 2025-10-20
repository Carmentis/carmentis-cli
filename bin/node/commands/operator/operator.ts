import commander from "commander";
import {OperatorInitCommand} from "./init";
import {OperatorTokenCommand} from "./token";
import {OperatorUnsafeReset} from "./unsafe-reset";

export class OperatorCommand {
    register(program: commander.Command) {
        const nodeCommand = program
            .command('operator')
            .description("Commands for operator.");


        // register additional commands
        new OperatorInitCommand().register(nodeCommand)
        new OperatorTokenCommand().register(nodeCommand)
        new OperatorUnsafeReset().register(nodeCommand)
    }
}
