"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorCommand = void 0;
const OperatorInitConfigCommand_1 = require("./OperatorInitConfigCommand");
const OperatorTokenCommand_1 = require("./OperatorTokenCommand");
const OperatorUnsafeResetCommand_1 = require("./OperatorUnsafeResetCommand");
class OperatorCommand {
    static register(program) {
        const nodeCommand = program
            .command('operator')
            .description("Commands for operator.");
        // register additional commands
        OperatorInitConfigCommand_1.OperatorInitCommand.register(nodeCommand);
        new OperatorTokenCommand_1.OperatorTokenCommand().register(nodeCommand);
        new OperatorUnsafeResetCommand_1.OperatorUnsafeReset().register(nodeCommand);
    }
}
exports.OperatorCommand = OperatorCommand;
