"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeInitConfigCommand = void 0;
const safeCommandRunner_1 = require("../safeCommandRunner");
const NodeConfigGenerator_1 = require("../../services/node/NodeConfigGenerator");
const dockerBinary_1 = require("../../utils/dockerBinary");
const NodeConfigParamsResolver_1 = require("../../services/node/NodeConfigParamsResolver");
class NodeInitConfigCommand {
    static register(program) {
        NodeInitConfigCommand.registerOptions(program
            .command('init-config')
            .description('Create a new node configuration')
            .option('--home <home>', 'Path to create the configuration'))
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                // ensure binaries are installed
                const areAllBinariesInstalled = dockerBinary_1.DockerBinary.isDockerInstalled();
                if (!areAllBinariesInstalled) {
                    console.error('Please, ensure go, cometbft and docker are all installed before to proceed.');
                    return;
                }
                // resolve the node config parameters
                const nodeParams = await NodeConfigParamsResolver_1.NodeConfigParamsResolver.resolveParams(options);
                const init = new NodeConfigGenerator_1.NodeConfigGenerator(nodeParams);
                await init.generateConfig();
                // show the result message
                const home = nodeParams.home;
                console.log(`Congrats, your node configuration has been created at ${home}!`);
            });
        });
        return program;
    }
    static registerOptions(program) {
        return program
            .option('--join-network <network>', 'Creates a configuration to join a known network.')
            .option('--join-from-endpoints <endpoints...>', 'Creates a configuration to a network from node endpoints.\n' +
            'Each entry can be of the form:\n' +
            '- https://node.com for automatic RPC/P2P endpoint recovery\n' +
            '- rpc:https://node.com to specify RPC endpoint\n' +
            '- p2p:nodeid@node.com to specify P2P endpoint\n')
            .option('--moniker <moniker>', 'Name of the node')
            .option('-e|--exposed-rpc-endpoint <exposed-rpc-endpoint>', 'The endpoint from which one can contact the RPC interface of your node.')
            .option('--trust-height <height>', 'Height from which the blockchain is trusted')
            .option('--private-key <sk>', 'Private key used to generate the genesis state.');
    }
}
exports.NodeInitConfigCommand = NodeInitConfigCommand;
