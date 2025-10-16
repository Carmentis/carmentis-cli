"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitService = void 0;
const networksStore_1 = require("./networksStore");
const prompts_1 = require("@inquirer/prompts");
const dockerBinary_1 = require("./dockerBinary");
const cometBFTEndpointAccumulator_1 = require("./cometBFTEndpointAccumulator");
const nodeInfo_1 = require("./nodeInfo");
const CometBFTConfigGenerator_1 = require("./CometBFTConfigGenerator");
const path_1 = require("path");
const AbciConfigGenerator_1 = require("./AbciConfigGenerator");
const EndpointTransformer_1 = require("./EndpointTransformer");
const server_1 = require("@cmts-dev/carmentis-sdk/server");
const FileDownloader_1 = require("./FileDownloader");
const NodeInfoFetcher_1 = require("./NodeInfoFetcher");
class InitService {
    constructor(params) {
        this.params = params;
        this.isJoining = false;
    }
    async generateConfig() {
        // ensure binaries are installed
        const areAllBinariesInstalled = dockerBinary_1.DockerBinary.isDockerInstalled();
        //CometbftBinary.isGoInstalled() &&
        //CometbftBinary.isCometBFTInstalled();
        if (!areAllBinariesInstalled) {
            console.error('Please, ensure go, cometbft and docker are all installed before to proceed.');
            return;
        }
        // start the configuration generation process
        this.isJoining = await this.askIfJoiningExistingNetwork();
        if (this.isJoining) {
            await this.handleJoinNetworkInit();
        }
        else {
            await this.handleNetworkCreationInit();
        }
        // compute the path
        const home = this.params.home;
        console.log(`Congrats, your node configuration has been created at ${home}!`);
    }
    async handleJoinNetworkInit() {
        // if the user has provided rpc nodes, then use it, otherwise ask for name
        const hasSpecifiedEndpoints = typeof this.params.joinedNetworkEndpoints !== 'undefined';
        if (hasSpecifiedEndpoints) {
            const accumulator = new cometBFTEndpointAccumulator_1.CometBFTEndpointAccumulator();
            // @ts-ignore
            for (const endpoint of this.params.joinedNetworkEndpoints) {
                await accumulator.parseEndpoint(endpoint);
            }
            await this.createConfigFromEndpoints(accumulator);
        }
        else {
            // ask the user to select a network to join
            const networksStore = new networksStore_1.NetworksStore();
            const networkNames = await networksStore.getNetworkNames();
            const chosenNetworkName = await this.askChoiceAmongKnownNetworks(networkNames);
            // load endpoints from the chosen networks
            const nodeService = new nodeInfo_1.NodeInfoService();
            const nodes = await nodeService.listNodesInNetwork(networksStore, chosenNetworkName);
            const accumulator = new cometBFTEndpointAccumulator_1.CometBFTEndpointAccumulator();
            for (const node of nodes) {
                if (node.nodeId) {
                    await accumulator.addRpcEndpoint(node.rpcEndpoint);
                    await accumulator.addP2PEndpoint(`${node.nodeId}@${node.p2pEndpoint}`);
                }
                else {
                    console.warn(`Node ${node.hostname} seems offline, skipping this node`);
                }
            }
            await this.createConfigFromEndpoints(accumulator);
        }
    }
    async createConfigFromEndpoints(endpoints) {
        // ask config-independent information
        const home = this.getCometbftHome();
        const moniker = await this.askMoniker();
        const exposedRpcEndpoint = await this.askExposedRpcEndpoint();
        // cometbft-related config-independent config variables
        const corsAllowedOrigins = ["*"];
        const proxyApp = "tcp://node-abci:26658";
        const rpcListeningAddr = "tcp://0.0.0.0:26657";
        if (this.isJoining) {
            // ask to chosen from which RPC endpoint we can recover information
            const chosenRpcEndpoint = await this.askToChooseEndpointToRecoverGenesisSnapshot(endpoints.getRpcEndpoints());
            // ask height from which we should trust the blockchain
            const trustHeight = await this.askTrustHeight();
            // load the genesis from it
            const fetcher = new NodeInfoFetcher_1.NodeInfoFetcher(chosenRpcEndpoint);
            const genesis = await fetcher.fetchGenesis();
            // generate the cometbft config
            const cometBFTConfigGenerator = new CometBFTConfigGenerator_1.CometBFTConfigGenerator({
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
            const abciConfigGenerator = new AbciConfigGenerator_1.AbciConfigGenerator({
                home: this.params.home,
                exposedRpcEndpoint: exposedRpcEndpoint,
                genesis_snapshot: {
                    fromRpcEndpoint: chosenRpcEndpoint,
                },
            });
            await abciConfigGenerator.generateConfig();
        }
        else {
            // ask to chosen from which RPC endpoint we can recover information
            const networkName = await this.askNetworkNameToCreate();
            const sk = await this.askGenesisPrivateKey();
            // generate the cometbft config
            const cometBFTConfigGenerator = new CometBFTConfigGenerator_1.CometBFTConfigGenerator({
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
            const abciConfigGenerator = new AbciConfigGenerator_1.AbciConfigGenerator({
                home: this.params.home,
                exposedRpcEndpoint: exposedRpcEndpoint,
                genesis: {
                    sk: sk,
                },
            });
            await abciConfigGenerator.generateConfig();
        }
        // download the Docker-compose
        const dockerComposePath = (0, path_1.join)(this.params.home, 'docker-compose.yml');
        await FileDownloader_1.FileDownloader.downloadCaddyFeaturedComposeAt(dockerComposePath);
        // download the Caddyfile
        const caddyfilePath = (0, path_1.join)(this.params.home, 'Caddyfile');
        const transformer = new EndpointTransformer_1.EndpointTransformer(exposedRpcEndpoint);
        const exposedRpcHostname = transformer.extractHostname();
        await FileDownloader_1.FileDownloader.downloadCaddyFileAt(caddyfilePath, exposedRpcHostname);
    }
    async askNetworkNameToCreate() {
        return (0, prompts_1.input)({
            message: 'Enter the name of the network you want to create:',
            required: true,
        });
    }
    async askGenesisPrivateKey() {
        return (this.params.genesisPrivateKey ||
            (0, prompts_1.input)({
                message: 'Enter the private key used to generate the genesis state',
                required: true,
                validate: (value) => {
                    const encoder = server_1.StringSignatureEncoder.defaultStringSignatureEncoder();
                    try {
                        encoder.decodePrivateKey(value);
                        return true;
                    }
                    catch {
                        return false;
                    }
                },
            }));
    }
    async handleNetworkCreationInit() {
        const endpoints = new cometBFTEndpointAccumulator_1.CometBFTEndpointAccumulator();
        await this.createConfigFromEndpoints(endpoints);
    }
    askMoniker() {
        return (this.params.moniker ||
            (0, prompts_1.input)({
                message: 'Enter the name of your node',
                required: true,
                validate: (value) => typeof value === 'string' && value.length > 0,
            }));
    }
    askExposedRpcEndpoint() {
        return (this.params.exposedRpcEndpoint ||
            (0, prompts_1.input)({
                message: 'Enter the endpoint where one can contact the RPC interface of your node',
                required: true,
                validate: (value) => {
                    const transformer = new EndpointTransformer_1.EndpointTransformer(value);
                    return transformer.isHttpOrHttpsEndpoint();
                },
            }));
    }
    askChoiceAmongKnownNetworks(networks) {
        return (0, prompts_1.select)({
            message: 'Select the network you want to join',
            choices: networks,
        });
    }
    askIfJoiningExistingNetwork() {
        return (0, prompts_1.confirm)({
            message: 'Are you joining an existing network?',
            default: true,
        });
    }
    getCometbftHome() {
        return (0, path_1.join)(this.params.home, 'cometbft');
    }
    async askToChooseEndpointToRecoverGenesisSnapshot(endpoints) {
        return (0, prompts_1.select)({
            choices: endpoints,
            message: 'Select one the RPC endpoint to recover the genesis snapshot',
            default: endpoints[0],
        });
    }
    async askTrustHeight() {
        return (await (0, prompts_1.input)({
            message: "Indicate the height from which we should trust the blockchain (positive number or 'last' for latest block):",
            default: this.params.trustHeight ?? 'last',
            required: true,
            validate: (value) => {
                if (value === 'last')
                    return true;
                try {
                    const height = Number.parseInt(value);
                    return height !== Number.NaN && height > 0;
                }
                catch {
                    return false;
                }
            },
        }));
    }
}
exports.InitService = InitService;
