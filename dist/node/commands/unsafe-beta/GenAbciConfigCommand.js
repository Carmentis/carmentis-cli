"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenAbciConfigCommand = void 0;
const safeCommandRunner_1 = require("../safeCommandRunner");
const AbciConfigGenerator_1 = require("../../services/AbciConfigGenerator");
const node_path_1 = __importDefault(require("node:path"));
class GenAbciConfigCommand {
    static register(program) {
        program
            .command('gen-abci-config')
            .description('Generate an ABCI configuration file with default parameters')
            .action(async () => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                const homePath = node_path_1.default.resolve('.');
                const abciConfigGenerator = new AbciConfigGenerator_1.AbciConfigGenerator({
                    home: homePath,
                    exposedRpcEndpoint: 'http://localhost:26657',
                    exposedRpcDomainName: 'localhost',
                    nodeConfigFilename: 'config.toml'
                });
                await abciConfigGenerator.generateConfig();
                console.log('ABCI configuration file generated successfully at config.toml');
            });
        });
    }
}
exports.GenAbciConfigCommand = GenAbciConfigCommand;
