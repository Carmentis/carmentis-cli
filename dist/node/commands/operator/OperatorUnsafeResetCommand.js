"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorUnsafeReset = void 0;
const safeCommandRunner_1 = require("../safeCommandRunner");
const prompts_1 = require("@inquirer/prompts");
const FileManager_1 = require("../../utils/FileManager");
const node_path_1 = __importDefault(require("node:path"));
class OperatorUnsafeReset {
    register(program) {
        program
            .command('unsafe-reset')
            .description('Reset the operator (delete all the data)')
            .option('--home <home>', 'Path where config files have been generated', '.')
            .option('-f,--force', 'Force the deletion of the data')
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                // resolve the current path
                const homePath = node_path_1.default.resolve(options.home);
                const storagePath = node_path_1.default.join(homePath, 'operator-storage');
                const confirmed = options.force || await (0, prompts_1.confirm)({
                    message: `Are you sure to delete ${storagePath}?`,
                    default: false
                });
                if (confirmed) {
                    await FileManager_1.FileManager.deleteDir(storagePath);
                }
                else {
                    console.log('Reset not confirmed, aborting');
                }
            });
        });
    }
}
exports.OperatorUnsafeReset = OperatorUnsafeReset;
