import { NodeConfigGenerationParams} from "./NodeConfigGenerator";
import {confirm} from "@inquirer/prompts";
import {input, select, checkbox} from "@inquirer/prompts";
import {CryptoEncoderFactory} from "@cmts-dev/carmentis-sdk/client";
import {EndpointTransformer} from "../../utils/EndpointTransformer";
import path from "node:path";
import {NetworksStore} from "../networksStore";
import * as v from 'valibot';
import {join} from "path";
import {CMTSToken} from "@cmts-dev/carmentis-sdk/server";
import {Network, NetworkNode} from "../../types/NetworksFile";
import {AbstractNodeConfigParamsResolver} from "./AbstractNodeConfigParamsResolver";
import {
    CometBFTConfig, CometBFTConfigPartial,
    CometBFTConfigSchema, CometBFTConsensus,
    CometBFTConsensusSchema,
    CometBFTP2P, CometBFTP2PPartial, CometBFTP2PSchema, CometBFTRPCPartial, CometBFTRpcSchema,
    CometBFTStateSync, CometBFTStateSyncPartial, CometBFTStateSyncSchema
} from "../../types/CometbftConfig";
import {NodeInfoService} from "../nodeInfo";
import {NodeInfoFetcher} from "../../utils/NodeInfoFetcher";


export class NodeConfigParamsResolver extends AbstractNodeConfigParamsResolver {

    static resolveParams(options: any) {
        const resolver = new NodeConfigParamsResolver(options);
        return resolver.generateParams();
    }

    constructor(options: any, private readonly  store = new NetworksStore()) {
        super(options);
    }

    private async generateParams() {

        // ask the for network
        const networkNames = await this.store.getNetworkNames();
        const chosenNetworkName = await this.askChoiceAmongKnownNetworks(networkNames);
        const networksStore = new NetworksStore();
        const chosenNetwork = await networksStore.getNetworkByName(chosenNetworkName);
        if (chosenNetwork === undefined) throw new Error(`Network ${chosenNetworkName} not found: Please register the network first.`)


        // ask the moniker
        const moniker = await this.askMoniker();

        // ask is the new node is a seed or not
        const isSeed = await this.askCurrentNodeIsSeed();

        // ask the node domain name and endpoints
        const hostDomainName = await this.askNodeDomainName();
        const exposedRpcEndpoint = await this.askExposedRpcEndpoint(hostDomainName);
        const exposedP2pEndpoint = await this.askExternalP2PAddr(hostDomainName);




        // ask for minimum gas (If running as seed then put irrealistic min gas price)
        const minMicroblockGasInAtomicAccepted = isSeed ?
            CMTSToken.oneCMTS().getAmountAsAtomic() :
            await this.askMinimumGasPriceAccepted();

        // recover the seeds from the network
        const nodeService = new NodeInfoService();
        const nodes = await nodeService.listNodesInNetwork(chosenNetworkName, chosenNetwork);
        const seedPeers: NetworkNode[] = await this.askSeedPeersP2pTcpEndpoint(nodes);

        // ask for RPC endpoint to recover snapshot
        const chosenRpcEndpointToRecoverGenesisSnapshot = await this.askToChooseNodeToRecoverGenesisSnapshot(
            chosenNetwork
        );
        // load the genesis from it
        const genesisNodeFetcher = NodeInfoFetcher.createFromNode(chosenRpcEndpointToRecoverGenesisSnapshot);
        const genesis = await genesisNodeFetcher.fetchGenesisObject();
        if (genesis === undefined) {
            const shouldContinue = await this.askToContinueWithoutGenesis();
            if (!shouldContinue) {
                throw new Error('Genesis not provided by the RPC node.')
            }
        }


        // ask persistent peers
        const belongsToInitialNetwork = this.belongsToNetwork(chosenNetwork, hostDomainName);
        let persistentPeers: NetworkNode[] = [];
        if (belongsToInitialNetwork) {
            console.log("This node is part of the initial network: making it fully connected")
            persistentPeers = this.selectAllNodesExceptItselfInNet(chosenNetwork, hostDomainName);
        } else {
            persistentPeers = await this.askPersistentPeersRcpTcpEndpoint(nodes);
        }


        // ask for state-sync
        let possibleRpcServers = nodes.filter(node => !node.isSeed);
        let chosenRpcServersForStateSync: NetworkNode[] = [];
        let trustHeight, trustHash;
        let enableStateSync = false;
        let specifiedTrustHeight : number | 'last' = 0;// = await this.askTrustHeight();
        const canEnableStateSync = possibleRpcServers.length >= 2;
        if (!canEnableStateSync) {
            console.warn("Not enough nodes found to enable state sync, skipping state sync configuration.");
        } else {
            const userWantsStateSync = await confirm({
                message: "Do you want to enable state sync?",
                default: true,
            });
            if (!userWantsStateSync) {
                console.log("State sync disabled.");
            } else {
                // ask the user to select the RPC servers to use for state sync
                chosenRpcServersForStateSync = await this.askRpcServersForStateSync(possibleRpcServers);
                if (chosenRpcServersForStateSync.length === 0) {
                    console.warn("No RPC servers selected for state sync: state sync disabled.");
                } else {
                    // if the provided trust height is 'last', use the first servers
                    const chosenRpcServer = chosenRpcServersForStateSync[0];
                    const fetcher = NodeInfoFetcher.createFromNode(chosenRpcServer);
                    specifiedTrustHeight = await this.askTrustHeight();

                    if (specifiedTrustHeight === 'last') {
                        const response = await fetcher.fetchLastHeightAndHash();
                        if (response !== undefined) {
                            const {
                                latest_block_hash,
                                latest_block_height
                            } = response;
                            trustHeight = latest_block_height;
                            trustHash = latest_block_hash;
                        }
                    } else {
                        const response = await fetcher.fetchHashFromHeight(specifiedTrustHeight);
                        if (response !== undefined) {
                            const {
                                block_height,
                                block_hash
                            } = response;
                            trustHash = block_hash;
                            trustHeight = block_height;
                        }
                    }
                    if (trustHeight !== undefined && trustHash !== undefined) {
                        enableStateSync = true;
                    } else {
                        throw new Error("Undefined trust height")
                    }
                }
            }
        }



        // halt if trust height or trust hash undefined
        if (trustHeight === undefined || trustHash === undefined) {
            trustHash = ''
            trustHeight = 0
        }

        // deduce the exposed RPC domain name
        const transformer = new EndpointTransformer(exposedRpcEndpoint);
        const exposedRpcDomainName = transformer.extractDomainName();

        // cometbft-related config-independent config variables
        const corsAllowedOrigins = await this.askCors();
        const proxyApp = "tcp://node-abci:26658";
        const rpcListeningAddr = "tcp://0.0.0.0:26657"


        const rpcPartial: CometBFTRPCPartial = {
            cors_allowed_origins: corsAllowedOrigins,
            laddr: rpcListeningAddr
        }

        const p2pPartial: CometBFTP2PPartial = {
            persistent_peers: persistentPeers
                .map((node: NetworkNode) => this.formatPersistentPeerForP2p(node))
                .join(','),
            external_address: exposedP2pEndpoint,
            seed_mode: isSeed,
            seeds: seedPeers
                .map((node: NetworkNode) => this.formatPersistentPeerForP2p(node))
                .join(','),
        }

        const stateSyncPartial: CometBFTStateSyncPartial = {
            enable: enableStateSync,
            trust_height: trustHeight,
            trust_hash: trustHash,
            rpc_servers: persistentPeers
                .map((node: NetworkNode) => this.formatRpcServersForStateSync(node))
                .join(','),
        }

        const cometbftConfig: CometBFTConfigPartial = {
            moniker,
            proxy_app: proxyApp,
            rpc: v.parse(CometBFTRpcSchema, rpcPartial),
            p2p: v.parse(CometBFTP2PSchema, p2pPartial),
            statesync: v.parse(CometBFTStateSyncSchema, stateSyncPartial),
            consensus: v.parse(CometBFTConsensusSchema, {})
        }

        const params: NodeConfigGenerationParams = {
            home: this.ensureHome(),
            genesisJson: genesis,
            shouldDownload: {
                caddyFile: true,
            },
            networkName: chosenNetworkName,
            choseNetwork: chosenNetwork,
            abciConfig: {
                home: this.getAbciHome(),
                exposedRpcEndpoint: exposedRpcEndpoint,
                exposedRpcDomainName: exposedRpcDomainName,
                genesis: undefined,
                genesis_snapshot_origin: chosenRpcEndpointToRecoverGenesisSnapshot,
                abciConfigFilename: 'config.toml',
                min_microblock_gas_price_in_atomics: minMicroblockGasInAtomicAccepted,
            },
            cometbftConfig: v.parse(CometBFTConfigSchema, cometbftConfig)
        };
        return params;
    }

    private belongsToNetwork(network: Network, hostname: string) {
        return Object.values(network.nodes).find(f => f.hostname === hostname)
    }

    private selectAllNodesExceptItselfInNet(network: Network, hostname: string): NetworkNode[] {
        return Object.values(network.nodes).filter(f => f.hostname === hostname)
    }


    private async askCurrentNodeIsSeed() {
        const message = [
            "Configure this node as a CometBFT seed node",
            "",
            "Seed nodes help peers discover other nodes in the network.",
            "They do not participate in consensus or relay transactions.",
            "",
            "More information:",
            "https://docs.cosmos.network/cometbft/latest/docs/core/Using-CometBFT#seed",
            "",
            "Run this node as a seed node?",
        ];

        return confirm({
            message: message.join("\n"),
            default: false,
        });
    }




    private async askSeedPeersP2pTcpEndpoint(nodes: NetworkNode[]): Promise<NetworkNode[]> {
        // load the endpoints and raise a message if no seed available
        const endpoints = nodes.filter(node => node.isSeed);
        if (endpoints.length === 0) {
            console.log("No seed nodes found, skipping seed peers selection.");
            return [];
        }

        const chosenNodes =  await checkbox<NetworkNode>({
            choices: endpoints.map(node => ({ name: node.hostname, value: node })),
            message: 'Select seed peers (used to discover new peers in the network, highly recommended):',
        });
        return chosenNodes;
    }

    private async askPersistentPeersRcpTcpEndpoint(nodes: NetworkNode[]): Promise<NetworkNode[]> {
        const nonSeedPeers = nodes.filter(node => !node.isSeed);
        const chosenNodes =  await checkbox<NetworkNode>({
            choices: nonSeedPeers.map(node => ({ name: node.hostname, value: node })),
            message: 'Select persistent peers (that will remain connected to your node):',
        });
        return chosenNodes;
    }

    /**
     * Returns the peer as a string in the format nodeId@hostname:port
     * @param node
     * @param port
     * @private
     */
    private formatRpcServersForStateSync(node: NetworkNode) {
        return `${node.hostname}:26657`;
    }

    /**
     * Returns the peer as a string in the format nodeId@hostname:port
     * @param node
     * @param port
     * @private
     */
    private formatPersistentPeerForP2p(node: NetworkNode, port = 26656) {
        return `${node.nodeId}@${node.hostname}:${port}`;
    }

    private async askRpcServersForStateSync(nodes: NetworkNode[]) {
        const rpcServers = nodes.filter(node => !node.isSeed);//.map(node => node.rpcEndpoint);
        const chosenRpcServers = await checkbox<NetworkNode>({
            choices: rpcServers.map(node => ({ name: node.rpcEndpoint, value: node })),
            message: 'Select RPC servers to use for state sync:',
        });
        return chosenRpcServers;
    }


    private askChoiceAmongKnownNetworks(networks: string[]) {
        return select<string>({
            message: 'Select the network you want to join',
            choices: networks,
        });
    }

    private async askToChooseNodeToRecoverGenesisSnapshot(network: Network) {
        const nodes = Object.values(network.nodes);
        return select<NetworkNode>({
            choices: nodes.map(node => ({ name: node.rpcEndpoint, value: node })),
            message: 'Select one RPC endpoint to recover the genesis snapshot (used only during block-sync, not during state-sync):',
            default: nodes[0],
        });
    }

    private async askTrustHeight(): Promise<number|'last'> {
        return (await input({
            message:
                "Indicate the height from which we should trust the blockchain (positive number or 'last' for latest block):",
            default: this.options.trustHeight ?? 'last',
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

    private async askToContinueWithoutGenesis() {
        return (await confirm({
            message: 'Genesis not provided by the RPC node. Do you want to continue without it?',
            default: false,
        })) as boolean;
    }
}