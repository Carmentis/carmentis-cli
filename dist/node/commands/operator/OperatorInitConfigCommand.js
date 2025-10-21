"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorInitCommand = void 0;
const OperatorConfigGenerator_1 = require("../../services/operator/OperatorConfigGenerator");
const safeCommandRunner_1 = require("../safeCommandRunner");
const OperatorConfigParamsResolver_1 = require("../../services/operator/OperatorConfigParamsResolver");
class OperatorInitCommand {
    static register(program) {
        program
            .command('init-config')
            .description('Create a new operator configuration')
            .option('--home <home>', 'Path to create the configuration', '.')
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                // asks for missing information
                const params = await OperatorConfigParamsResolver_1.OperatorConfigParamsResolver.resolveParams(options);
                const generator = new OperatorConfigGenerator_1.OperatorConfigGenerator(params);
                await generator.generateConfig();
                // show the result message
                const home = params.operatorHome;
                console.log(`Congrats, your node configuration has been created at ${home}!`);
            });
        });
        OperatorInitCommand.registerOptions(program);
    }
    static registerOptions(program) {
        program
            .option('--workspace-domain-name <workspace-domain-name>', "Domain name of the workspace")
            .option('--operator-domain-name <operator-domain-name>', "Domain name of the operator")
            .option('--node-url <node-url>', "Url of the node used by the operator to interact with the chain");
    }
}
exports.OperatorInitCommand = OperatorInitCommand;
