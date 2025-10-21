"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorTokenCommand = void 0;
const safeCommandRunner_1 = require("../safeCommandRunner");
const node_path_1 = __importDefault(require("node:path"));
const FileManager_1 = require("../../utils/FileManager");
class OperatorTokenCommand {
    register(program) {
        program
            .command('token')
            .description("Show the initial admin creation token")
            .option('--home <home>', 'Path where config files have been generated', '.')
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                const configPath = node_path_1.default.resolve(options.home);
                const adminTokenFile = node_path_1.default.join(configPath, 'operator-storage', 'admin-token.txt');
                const content = await FileManager_1.FileManager.readFile(adminTokenFile);
                console.log(content);
            });
        });
    }
}
exports.OperatorTokenCommand = OperatorTokenCommand;
