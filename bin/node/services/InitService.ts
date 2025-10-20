import { NetworksStore } from './networksStore';
import { confirm, input, select } from '@inquirer/prompts';
import { DockerBinary } from '../utils/dockerBinary';
import { CometBFTBinary } from './CometBFTBinary';
import { CometBFTEndpointAccumulator } from './cometBFTEndpointAccumulator';
import { NodeInfoService } from './nodeInfo';
import { CometBFTConfigGenerator } from './CometBFTConfigGenerator';
import { join } from 'path';
import { AbciConfigGenerator } from './AbciConfigGenerator';
import { EndpointTransformer } from '../utils/EndpointTransformer';
import { StringSignatureEncoder } from '@cmts-dev/carmentis-sdk/server';
import { FileDownloader } from '../utils/FileDownloader';
import { NodeInfoFetcher } from '../utils/NodeInfoFetcher';

export type InitParameters = {
    home: string;
    joinedNetworkName?: string;
    joinedNetworkEndpoints?: string[];
    moniker?: string;
    exposedRpcEndpoint?: string;
    trustHeight?: string;
    genesisPrivateKey?: string;
};

export class InitService {
    private isJoining: boolean;
    constructor(private readonly params: InitParameters) {
        this.isJoining = false;
    }

    async generateConfig() {
        // ensure binaries are installed
        const areAllBinariesInstalled =
            DockerBinary.isDockerInstalled();
            //CometbftBinary.isGoInstalled() &&
            //CometbftBinary.isCometBFTInstalled();

        if (!areAllBinariesInstalled) {
            console.error(
                'Please, ensure go, cometbft and docker are all installed before to proceed.',
            );
            return;
        }

        // start the configuration generation process
        this.isJoining = await this.askIfJoiningExistingNetwork();
        if (this.isJoining) {
            await this.handleJoinNetworkInit();
        } else {
            await this.handleNetworkCreationInit();
        }

        // compute the path
        const home = this.params.home;
        console.log(`Congrats, your node configuration has been created at ${home}!`);
    }

    private async handleJoinNetworkInit() {
        // if the user has provided rpc nodes, then use it, otherwise ask for name
        const hasSpecifiedEndpoints = typeof this.params.joinedNetworkEndpoints !== 'undefined';
        if (hasSpecifiedEndpoints) {
            const accumulator = new CometBFTEndpointAccumulator();
            // @ts-ignore
            for (const endpoint of this.params.joinedNetworkEndpoints) {
                await accumulator.parseEndpoint(endpoint);
            }
            await this.createConfigFromEndpoints(accumulator);
        } else {
            // ask the user to select a network to join
            const networksStore = new NetworksStore();
            const networkNames = await networksStore.getNetworkNames();
            const chosenNetworkName = await this.askChoiceAmongKnownNetworks(networkNames);

            // load endpoints from the chosen networks
            const nodeService = new NodeInfoService();
            const nodes = await nodeService.listNodesInNetwork(networksStore, chosenNetworkName);
            const accumulator = new CometBFTEndpointAccumulator();
            for (const node of nodes) {
                if (node.nodeId) {
                    await accumulator.addRpcEndpoint(node.rpcEndpoint);
                    await accumulator.addP2PEndpoint(`${node.nodeId}@${node.p2pEndpoint}`);
                } else {
                    console.warn(`Node ${node.hostname} seems offline, skipping this node`);
                }
            }
            await this.createConfigFromEndpoints(accumulator);
        }
    }

    private async createConfigFromEndpoints(endpoints: CometBFTEndpointAccumulator) {
        // ask config-independent information
        const home = this.getCometbftHome();
        const moniker = await this.askMoniker();
        const exposedRpcEndpoint = await this.askExposedRpcEndpoint();

        // cometbft-related config-independent config variables
        const corsAllowedOrigins = ["*"];
        const proxyApp = "tcp://node-abci:26658";
        const rpcListeningAddr = "tcp://0.0.0.0:26657"

        if (this.isJoining) {
            // ask to chosen from which RPC endpoint we can recover information
            const chosenRpcEndpoint = await this.askToChooseEndpointToRecoverGenesisSnapshot(
                endpoints.getRpcEndpoints(),
            );

            // ask height from which we should trust the blockchain
            const trustHeight = await this.askTrustHeight();

            // load the genesis from it
            const fetcher = new NodeInfoFetcher(chosenRpcEndpoint);
            const genesis = await fetcher.fetchGenesis();

            // generate the cometbft config
            const cometBFTConfigGenerator = new CometBFTConfigGenerator({
                home: home,
                moniker: moniker,
                endpoints: endpoints,
                genesis: {
                    overrideWith: genesis,
                },
                stateSync: {
                    enabled: true,
                    trustHeight: trustHeight
                },
                cors: {
                    allowedOrigins: corsAllowedOrigins
                },
                proxyApp: proxyApp,
                rpc: { laddr: rpcListeningAddr }
            });
            await cometBFTConfigGenerator.generateConfig();

            // we indicate the chosen RPC endpoint to indicate where the genesis snapshot can be downloaded
            const abciConfigGenerator = new AbciConfigGenerator({
                home: this.params.home,
                exposedRpcEndpoint: exposedRpcEndpoint,
                genesis_snapshot: {
                    fromRpcEndpoint: chosenRpcEndpoint,
                },
            });
            await abciConfigGenerator.generateConfig();
        } else {
            // ask to chosen from which RPC endpoint we can recover information
            const networkName = await this.askNetworkNameToCreate();
            const sk = await this.askGenesisPrivateKey();

            // generate the cometbft config
            const cometBFTConfigGenerator = new CometBFTConfigGenerator({
                home: home,
                moniker: moniker,
                endpoints: endpoints,
                genesis: {
                    networkName: networkName,
                },
                stateSync: {
                    enabled: false,
                },
                cors: {
                    allowedOrigins: corsAllowedOrigins
                },
                proxyApp: proxyApp,
                rpc: { laddr: rpcListeningAddr }
            });
            await cometBFTConfigGenerator.generateConfig();

            // we indicate the chosen RPC endpoint to indicate where the genesis snapshot can be downloaded
            const abciConfigGenerator = new AbciConfigGenerator({
                home: this.params.home,
                exposedRpcEndpoint: exposedRpcEndpoint,
                genesis: {
                    sk: sk,
                },
            });
            await abciConfigGenerator.generateConfig();
        }

        // download the Docker-compose
        const dockerComposePath = join(this.params.home, 'docker-compose.yml');
        await FileDownloader.downloadCaddyFeaturedComposeAt(dockerComposePath);

        // download the Caddyfile
        const caddyfilePath = join(this.params.home, 'Caddyfile');
        const transformer = new EndpointTransformer(exposedRpcEndpoint);
        const exposedRpcHostname = transformer.extractHostname();
        await FileDownloader.downloadCaddyFileAt(caddyfilePath, exposedRpcHostname);
    }

    private async askNetworkNameToCreate() {
        return input({
            message: 'Enter the name of the network you want to create:',
            required: true,
        });
    }


    private async askGenesisPrivateKey() {
        return (
            this.params.genesisPrivateKey ||
            input({
                message: 'Enter the private key used to generate the genesis state',
                required: true,
                validate: (value: string) => {
                    const encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
                    try {
                        encoder.decodePrivateKey(value);
                        return true;
                    } catch {
                        return false;
                    }
                },
            })
        );
    }

    private async handleNetworkCreationInit() {
        const endpoints = new CometBFTEndpointAccumulator();
        await this.createConfigFromEndpoints(endpoints);
    }

    private askMoniker() {
        return (
            this.params.moniker ||
            input({
                message: 'Enter the name of your node',
                required: true,
                validate: (value: string) => typeof value === 'string' && value.length > 0,
            })
        );
    }

    private askExposedRpcEndpoint() {
        return (
            this.params.exposedRpcEndpoint ||
            input({
                message: 'Enter the endpoint where one can contact the RPC interface of your node',
                required: true,
                validate: (value: string) => {
                    const transformer = new EndpointTransformer(value);
                    return transformer.isHttpOrHttpsEndpoint();
                },
            })
        );
    }

    private askChoiceAmongKnownNetworks(networks: string[]) {
        return select<string>({
            message: 'Select the network you want to join',
            choices: networks,
        });
    }

    private askIfJoiningExistingNetwork() {
        return confirm({
            message: 'Are you joining an existing network?',
            default: true,
        });
    }

    private getCometbftHome() {
        return join(this.params.home, 'cometbft');
    }

    private async askToChooseEndpointToRecoverGenesisSnapshot(endpoints: string[]) {
        return select<string>({
            choices: endpoints,
            message: 'Select one the RPC endpoint to recover the genesis snapshot',
            default: endpoints[0],
        });
    }

    private async askTrustHeight(): Promise<number|'last'> {
        return (await input({
            message:
                "Indicate the height from which we should trust the blockchain (positive number or 'last' for latest block):",
            default: this.params.trustHeight ?? 'last',
            required: true,
            validate: (value: string) => {
                if (value === 'last') return true;
                try {
                    const height = Number.parseInt(value);
                    return height !== Number.NaN && height > 0;
                } catch {
                    return false;
                }
            },
        })) as unknown as number;
    }
}
