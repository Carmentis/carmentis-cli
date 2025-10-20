import commander from 'commander';
import { SafeCommandRunner } from '../safeCommandRunner';

import { InitService } from '../../services/InitService';

export class InitNodeConfigCommand {
    register(program: commander.Command) {
        program
            .command('init-config')
            .description('Create a new node configuration')
            .option('--home <home>', 'Path to create the configuration')
            .option('--join-network <network>', 'Creates a configuration to join a known network.')
            .option(
                '--join-from-endpoints <endpoints...>',
                'Creates a configuration to a network from node endpoints.\n' +
                    'Each entry can be of the form:\n' +
                    '- https://node.com for automatic RPC/P2P endpoint recovery\n' +
                    '- rpc:https://node.com to specify RPC endpoint\n' +
                    '- p2p:nodeid@node.com to specify P2P endpoint\n',
            )
            .option('--moniker <moniker>', 'Name of the node')
            .option('-e|--exposed-rpc-endpoint <exposed-rpc-endpoint>', 'The endpoint from which one can contact the RPC interface of your node.')
            .option('--trust-height <height>', 'Height from which the blockchain is trusted')
            .option('--private-key <sk>', 'Private key used to generate the genesis state.')
            .action(async (options) => {
                await SafeCommandRunner.safeRun(async () => {

                    const joinedNetworkName =
                        typeof options.joinNetwork === 'string' ? options.joinNetwork : undefined;
                    const joinedNetworkEndpoints =
                        typeof options.joinFromEndpoints !== 'undefined'
                            ? options.joinFromEndpoints
                            : undefined;

                    // create and configure the config init service
                    const init = new InitService({
                        home: options.home,
                        joinedNetworkName,
                        joinedNetworkEndpoints: joinedNetworkEndpoints,
                        moniker: options.moniker,
                        exposedRpcEndpoint: options.exposedRpcEndpoint,
                        trustHeight: options.trustHeight,
                        genesisPrivateKey: options.sk,
                    });

                    // run the configuration generation
                    await init.generateConfig();
                });
            });
    }
}
