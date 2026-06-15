import commander from 'commander';
import {SafeCommandRunner} from '../safeCommandRunner';

import {NodeConfigGenerator} from '../../services/node/NodeConfigGenerator';
import {DockerBinary} from "../../utils/dockerBinary";
import {NodeConfigParamsResolver} from "../../services/node/NodeConfigParamsResolver";
import {GenesisNodeConfigParamsResolver} from "../../services/node/GenesisNodeConfigParamsResolver";

export class NodeInitGenesisConfigCommand {
    static register(program: commander.Command) {
        NodeInitGenesisConfigCommand.registerOptions(
            program
                .command('init-genesis-config')
                .description('Create a new genesis node configuration')
                .option('--home <home>', 'Path to create the configuration', '.')
        )
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {

                    // ensure binaries are installed
                    const areAllBinariesInstalled =
                        DockerBinary.isDockerInstalled();

                    if (!areAllBinariesInstalled) {
                        console.error(
                            'Please, ensure docker is installed before to proceed.',
                        );
                        return;
                    }

                    // resolve the node config parameters
                    const nodeParams = await GenesisNodeConfigParamsResolver.resolveParams(options);
                    const init = new NodeConfigGenerator(nodeParams);
                    await init.generateConfig();

                    // show the result message
                    const home = nodeParams.home;
                    console.log(`Congrats, your node configuration has been created at ${home}!`);
                });
            });
        return program;
    }

    static registerOptions(program: commander.Command) {
        return program
            .option('--join-network <network>', 'Creates a configuration to join a known network.')
            .option('--moniker <moniker>', 'Name of the node')
            .option('--private-key <sk>', 'Private key used to generate the genesis state.');
    }
}
