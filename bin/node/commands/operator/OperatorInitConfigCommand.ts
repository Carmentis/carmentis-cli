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
            .option('--operator-domain-name <operator-domain-name>', "Domain name of the operator")
    }




}