"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCommand = void 0;
const NodeInitConfigCommand_1 = require("./NodeInitConfigCommand");
class NodeCommand {
    static register(program) {
        const nodeCommand = program
            .command('node')
            .description("Command for Carmentis node");
        // register additional commands
        NodeInitConfigCommand_1.NodeInitConfigCommand.register(nodeCommand);
    }
}
exports.NodeCommand = NodeCommand;
