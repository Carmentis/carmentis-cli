import commander from "commander";
import {OperatorInitCommand} from "./OperatorInitConfigCommand";
import {OperatorTokenCommand} from "./OperatorTokenCommand";
import {OperatorUnsafeReset} from "./OperatorUnsafeResetCommand";

export class OperatorCommand {
    static register(program: commander.Command) {
        const nodeCommand = program
            .command('operator')
            .description("Commands for operator.");


        // register additional commands
        OperatorInitCommand.register(nodeCommand)
        new OperatorTokenCommand().register(nodeCommand)
        new OperatorUnsafeReset().register(nodeCommand)
    }
}
