"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCommand = void 0;
const init_1 = require("./init");
class NodeCommand {
    register(program) {
        const nodeCommand = program
            .command('node')
            .description("Command for Carmentis node");
        // register additional commands
        new init_1.InitNodeConfigCommand().register(nodeCommand);
    }
}
exports.NodeCommand = NodeCommand;
