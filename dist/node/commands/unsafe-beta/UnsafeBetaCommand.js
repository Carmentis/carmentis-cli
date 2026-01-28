"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsafeBetaCommand = void 0;
const GenAbciConfigCommand_1 = require("./GenAbciConfigCommand");
const GenDockerComposeCommand_1 = require("./GenDockerComposeCommand");
class UnsafeBetaCommand {
    static register(program) {
        const unsafeBetaCommand = program
            .command('unsafe-beta')
            .description("Commands still in testing (use at your own risk)");
        // register sub-commands
        GenAbciConfigCommand_1.GenAbciConfigCommand.register(unsafeBetaCommand);
        GenDockerComposeCommand_1.GenDockerComposeCommand.register(unsafeBetaCommand);
    }
}
exports.UnsafeBetaCommand = UnsafeBetaCommand;
