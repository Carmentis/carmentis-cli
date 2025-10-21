"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeConfigParamsResolver = void 0;
const prompts_1 = require("@inquirer/prompts");
const prompts_2 = require("@inquirer/prompts");
const client_1 = require("@cmts-dev/carmentis-sdk/client");
const EndpointTransformer_1 = require("../../utils/EndpointTransformer");
const node_path_1 = __importDefault(require("node:path"));
const cometBFTEndpointAccumulator_1 = require("../cometBFTEndpointAccumulator");
const networksStore_1 = require("../networksStore");
const nodeInfo_1 = require("../nodeInfo");
const NodeInfoFetcher_1 = require("../../utils/NodeInfoFetcher");
const path_1 = require("path");
class NodeConfigParamsResolver {
    static resolveParams(options) {
        const resolver = new NodeConfigParamsResolver(options);
        return resolver.generateParams();
    }
    constructor(options, store = new networksStore_1.NetworksStore()) {
        this.options = options;
        this.store = store;
    }
    async generateParams() {
        const moniker = await this.askMoniker();
        const exposedRpcEndpoint = await this.askExposedRpcEndpoint();
        const isJoining = await this.askIsJoiningExistingNetwork();
        const joiningParams = isJoining ? await this.askJoinParams() : undefined;
        const creationParams = isJoining ? undefined : await this.askCreationParams();
        const emptyInitialEndpointsSet = new cometBFTEndpointAccumulator_1.CometBFTEndpointAccumulator();
        // deduce the exposed RPC domain name
        const transformer = new EndpointTransformer_1.EndpointTransformer(exposedRpcEndpoint);
        const exposedRpcDomainName = transformer.extractDomainName();
        // cometbft-related config-independent config variables
        const corsAllowedOrigins = ["*"];
        const proxyApp = "tcp://node-abci:26658";
        const rpcListeningAddr = "tcp://0.0.0.0:26657";
        const params = {
            home: this.ensureHome(),
            shouldDownload: {
                caddyFile: true,
                dockerCompose: true,
            },
            abciConfig: {
                home: this.getAbciHome(),
                exposedRpcEndpoint: exposedRpcEndpoint,
                exposedRpcDomainName: exposedRpcDomainName,
                genesis: creationParams ? { sk: creationParams.genesisPrivateKey } : undefined,
                genesis_snapshot: joiningParams ? { fromRpcEndpoint: joiningParams.chosenRpcEndpoint } : undefined,
                nodeConfigFilename: 'config.toml'
            },
            cometbftConfig: {
                cors: {
                    allowedOrigins: corsAllowedOrigins
                },
                endpoints: joiningParams !== undefined ? joiningParams.joinedNetworkEndpoints : emptyInitialEndpointsSet,
                genesis: {
                    networkName: creationParams !== undefined ? creationParams.createdNetworkName : undefined,
                    overrideWith: joiningParams !== undefined ? joiningParams.genesis : undefined,
                },
                home: this.getCometbftHome(),
                moniker,
                proxyApp: proxyApp,
                rpc: {
                    laddr: rpcListeningAddr
                },
                stateSync: joiningParams !== undefined ? {
                    enabled: joiningParams.enableStateSync,
                    trustHeight: joiningParams.trustHeight,
                    trustHash: joiningParams.trustHash,
                } : undefined,
            }
        };
        return params;
    }
    async askJoinParams() {
        // if the user has provided rpc nodes, then use it, otherwise ask for name
        let endpoints;
        const hasSpecifiedEndpoints = typeof this.options.joinedNetworkEndpoints !== 'undefined';
        if (hasSpecifiedEndpoints) {
            endpoints = new cometBFTEndpointAccumulator_1.CometBFTEndpointAccumulator();
            for (const endpoint of this.options.joinedNetworkEndpoints) {
                await endpoints.parseEndpoint(endpoint);
            }
        }
        else {
            // ask the user to select a network to join
            const networkNames = await this.store.getNetworkNames();
            const chosenNetworkName = await this.askChoiceAmongKnownNetworks(networkNames);
            // load endpoints from the chosen networks
            const nodeService = new nodeInfo_1.NodeInfoService();
            const nodes = await nodeService.listNodesInNetwork(this.store, chosenNetworkName);
            endpoints = new cometBFTEndpointAccumulator_1.CometBFTEndpointAccumulator();
            for (const node of nodes) {
                if (node.nodeId) {
                    await endpoints.addRpcEndpoint(node.rpcEndpoint);
                    await endpoints.addP2PEndpoint(`${node.nodeId}@${node.p2pEndpoint}`);
                }
                else {
                    console.warn(`Node ${node.hostname} seems offline, skipping this node`);
                }
            }
        }
        // ask for trust height
        const chosenRpcEndpoint = await this.askToChooseEndpointToRecoverGenesisSnapshot(endpoints.getRpcEndpoints());
        const fetcher = new NodeInfoFetcher_1.NodeInfoFetcher(chosenRpcEndpoint);
        const specifiedTrustHeight = await this.askTrustHeight();
        // update rpc servers
        const rpcServers = endpoints.getRpcEndpoints();
        let trustHeight, trustHash;
        let enableStateSync = false;
        if (rpcServers.length >= 2) {
            // if the provided trust height is 'last', use the first servers
            const chosenRpcServer = rpcServers[0];
            const fetcher = new NodeInfoFetcher_1.NodeInfoFetcher(chosenRpcServer);
            if (specifiedTrustHeight === 'last') {
                const response = await fetcher.fetchLastHeightAndHash();
                if (response !== undefined) {
                    const { latest_block_hash, latest_block_height } = response;
                    trustHeight = latest_block_height;
                    trustHash = latest_block_hash;
                }
            }
            else {
                const response = await fetcher.fetchHashFromHeight(specifiedTrustHeight);
                if (response !== undefined) {
                    const { block_height, block_hash } = response;
                    trustHash = block_hash;
                    trustHeight = block_height;
                }
            }
            if (trustHeight !== undefined && trustHash !== undefined) {
                enableStateSync = true;
            }
            else {
                throw new Error("Undefined trust height");
            }
        }
        else {
            console.warn(`No sufficient RPC servers provided (${rpcServers.length} provided), cannot enable state sync`);
        }
        // load the genesis from it
        const genesis = await fetcher.fetchGenesis();
        if (genesis === undefined)
            throw new Error('Genesis not provided by the RPC node.');
        return {
            joinedNetworkEndpoints: endpoints,
            enableStateSync,
            trustHash: trustHash !== undefined ? trustHash : "",
            trustHeight: trustHeight !== undefined ? trustHeight : 0,
            genesis: genesis,
            chosenRpcEndpoint: chosenRpcEndpoint
        };
    }
    async askCreationParams() {
        const networkName = await this.askNetworkNameToCreate();
        const sk = await this.askGenesisPrivateKey();
        return {
            createdNetworkName: networkName, genesisPrivateKey: sk
        };
    }
    ensureHome() {
        const home = this.options.home;
        if (typeof home !== "string")
            throw new Error(`${home} is not provided but is required`);
        return node_path_1.default.resolve(home);
    }
    getAbciHome() {
        return this.options.home;
    }
    async askIsJoiningExistingNetwork() {
        return (typeof this.options.join === 'boolean' && this.options.join) || (0, prompts_1.confirm)({
            message: 'Are you joining an existing network?',
            default: true
        });
    }
    askMoniker() {
        return (this.options.moniker ||
            (0, prompts_2.input)({
                message: 'Enter the name of your node',
                required: true,
                validate: (value) => typeof value === 'string' && value.length > 0 && value.trim().length > 0,
            }));
    }
    askExposedRpcEndpoint() {
        return (this.options.exposedRpcEndpoint ||
            (0, prompts_2.input)({
                message: 'Enter the endpoint where one can contact the RPC interface of your node',
                required: true,
                validate: (value) => {
                    const transformer = new EndpointTransformer_1.EndpointTransformer(value);
                    return transformer.isHttpOrHttpsEndpoint();
                },
            }));
    }
    async askGenesisPrivateKey() {
        return (this.options.genesisPrivateKey ||
            (0, prompts_2.input)({
                message: 'Enter the private key used to generate the genesis state',
                required: true,
                validate: (value) => {
                    const encoder = client_1.StringSignatureEncoder.defaultStringSignatureEncoder();
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
    async askNetworkNameToCreate() {
        return (0, prompts_2.input)({
            message: 'Enter the name of the network you want to create:',
            required: true,
        });
    }
    askChoiceAmongKnownNetworks(networks) {
        return (0, prompts_2.select)({
            message: 'Select the network you want to join',
            choices: networks,
        });
    }
    async askToChooseEndpointToRecoverGenesisSnapshot(endpoints) {
        return (0, prompts_2.select)({
            choices: endpoints,
            message: 'Select one the RPC endpoint to recover the genesis snapshot',
            default: endpoints[0],
        });
    }
    async askTrustHeight() {
        return (await (0, prompts_2.input)({
            message: "Indicate the height from which we should trust the blockchain (positive number or 'last' for latest block):",
            default: this.options.trustHeight ?? 'last',
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
    getCometbftHome() {
        return (0, path_1.join)(this.options.home, 'cometbft');
    }
}
exports.NodeConfigParamsResolver = NodeConfigParamsResolver;
