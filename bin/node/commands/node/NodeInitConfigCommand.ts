import commander from 'commander';
import {SafeCommandRunner} from '../safeCommandRunner';

import {NodeConfigGenerator} from '../../services/node/NodeConfigGenerator';
import {DockerBinary} from "../../utils/dockerBinary";
import {NodeConfigParamsResolver} from "../../services/node/NodeConfigParamsResolver";

export class NodeInitConfigCommand {
    static register(program: commander.Command) {
        NodeInitConfigCommand.registerOptions(
            program
            .command('init-config')
            .description('Create a new node configuration')
            .option('--home <home>', 'Path to create the configuration', '.')
        )
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {

                    // ensure binaries are installed
                    const areAllBinariesInstalled =
                        DockerBinary.isDockerInstalled();

                    if (!areAllBinariesInstalled) {
                        console.error(
                            'Please, ensure go, cometbft and docker are all installed before to proceed.',
                        );
                        return;
                    }

                    // resolve the node config parameters
                    const nodeParams = await NodeConfigParamsResolver.resolveParams(options);
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
            .option(
                '--join-from-endpoints <endpoints...>',
                'Creates a configuration to a network from node endpoints.'
            )
            .option('--moniker <moniker>', 'Name of the node')
            .option('-e|--exposed-rpc-endpoint <exposed-rpc-endpoint>', 'The endpoint from which one can contact the RPC interface of your node.')
            .option('--p2p-tcp-endpoint <p2p-tcp-endpoint>', 'The TCP endpoint from which one can contact the P2P interface of your node (example: tcp://my-node.example.com:26656).')
            .option('--trust-height <height>', 'Height from which the blockchain is trusted')
            .option('--private-key <sk>', 'Private key used to generate the genesis state.');
    }
}
