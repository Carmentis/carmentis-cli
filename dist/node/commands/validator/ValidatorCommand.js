"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorCommand = void 0;
const ValidatorInitConfigCommand_1 = require("./ValidatorInitConfigCommand");
class ValidatorCommand {
    static register(program) {
        const nodeCommand = program
            .command('validator')
            .description("Commands for validator. A validator corresponds to a combination node-operator in a single installation");
        ValidatorInitConfigCommand_1.ValidatorInitConfigCommand.register(nodeCommand);
    }
}
exports.ValidatorCommand = ValidatorCommand;
