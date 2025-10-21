import commander from "commander";
import {ValidatorInitConfigCommand} from "./ValidatorInitConfigCommand";

export class ValidatorCommand {
    static register(program: commander.Command) {
        const nodeCommand = program
            .command('validator')
            .description("Commands for validator. A validator corresponds to a combination node-operator in a single installation");

        ValidatorInitConfigCommand.register(nodeCommand)

    }
}