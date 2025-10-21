import commander from "commander";
import {OperatorConfigGenerator} from "../../services/operator/OperatorConfigGenerator";
import {SafeCommandRunner} from "../safeCommandRunner";
import {OperatorConfigParamsResolver} from "../../services/operator/OperatorConfigParamsResolver";

export class OperatorInitCommand {
    static register(program: commander.Command) {
        program
            .command('init-config')
            .description('Create a new operator configuration')
            .option('--home <home>', 'Path to create the configuration', '.')
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {
                    // asks for missing information
                    const params = await OperatorConfigParamsResolver.resolveParams(options);
                    const generator = new OperatorConfigGenerator(params);
                    await generator.generateConfig();

                    // show the result message
                    const home = params.operatorHome;
                    console.log(`Congrats, your operator configuration has been created at ${home}!`);
                })
            })
        ;
        OperatorInitCommand.registerOptions(program);
    }

    static registerOptions(program: commander.Command) {
        program
            .option('--workspace-domain-name <workspace-domain-name>', "Domain name of the workspace")
            .option('--operator-domain-name <operator-domain-name>', "Domain name of the operator")
            .option('--node-url <node-url>', "Url of the node used by the operator to interact with the chain")
    }




}