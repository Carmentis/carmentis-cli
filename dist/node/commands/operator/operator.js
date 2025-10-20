"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorCommand = void 0;
const init_1 = require("./init");
const token_1 = require("./token");
const unsafe_reset_1 = require("./unsafe-reset");
class OperatorCommand {
    register(program) {
        const nodeCommand = program
            .command('operator')
            .description("Commands for operator.");
        // register additional commands
        new init_1.OperatorInitCommand().register(nodeCommand);
        new token_1.OperatorTokenCommand().register(nodeCommand);
        new unsafe_reset_1.OperatorUnsafeReset().register(nodeCommand);
    }
}
exports.OperatorCommand = OperatorCommand;
