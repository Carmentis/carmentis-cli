"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCommand = void 0;
const init_1 = require("./node/init");
class NodeCommand {
    register(program) {
        const nodeCommand = program
            .command('node')
            .description("Command to handle Carmentis node");
        // register additional commands
        new init_1.InitConfigCommand().register(nodeCommand);
    }
}
exports.NodeCommand = NodeCommand;
