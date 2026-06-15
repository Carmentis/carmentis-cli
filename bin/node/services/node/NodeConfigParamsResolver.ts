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

type NetworkJoinParams = {
    //persistentPeersRpcTcpEndpoint: NetworkNode[];
    //seeds: NetworkNode[];
    enableStateSync: boolean;
    trustHeight: number;
    trustHash: string;
    genesisObject: object;
    p2p: CometBFTP2PPartial,
    stateSync: CometBFTStateSyncPartial
    //chosenPeerToRecoverGenesisSnapshot: NetworkNode,
    //chosenPeersForStateSync: NetworkNode[]
}


export class NodeConfigParamsResolver extends AbstractNodeConfigParamsResolver {

    static resolveParams(options: any) {
        const resolver = new NodeConfigParamsResolver(options);
        return resolver.generateParams();
    }

    constructor(options: any, private readonly  store = new NetworksStore()) {
        super(options);
    }

    private async generateParams() {
        const moniker = await this.askMoniker();
        const hostDomainName = await this.askNodeDomainName();
        // ask for minimum gas
        const minMicroblockGasInAtomicAccepted = await this.askMinimumGasPriceAccepted();

        // ask the for network
        const networkNames = await this.store.getNetworkNames();
        const chosenNetworkName = await this.askChoiceAmongKnownNetworks(networkNames);
        const networksStore = new NetworksStore();
        const chosenNetwork = await networksStore.getNetworkByName(chosenNetworkName);
        if (chosenNetwork === undefined) throw new Error(`Network ${chosenNetworkName} not found: Please register the network first.`)

        // ask for RPC endpoint to recover snapshot
        const chosenRpcEndpointToRecoverGenesisSnapshot = await this.askToChooseNodeToRecoverGenesisSnapshot(
            chosenNetwork
        );

        const exposedRpcEndpoint = await this.askExposedRpcEndpoint(hostDomainName);
        const exposedP2pEndpoint = await this.askExternalP2PAddr(hostDomainName);
        const joiningParams = await this.askJoinParams(
            chosenRpcEndpointToRecoverGenesisSnapshot,
            chosenNetworkName,
            chosenNetwork
        );

        // deduce the exposed RPC domain name
        const transformer = new EndpointTransformer(exposedRpcEndpoint);
        const exposedRpcDomainName = transformer.extractDomainName();

        // cometbft-related config-independent config variables
        const cors = await this.askCors();
        const corsAllowedOrigins = cors;
        const proxyApp = "tcp://node-abci:26658";
        const rpcListeningAddr = "tcp://0.0.0.0:26657"


        const rpcPartial: CometBFTRPCPartial = {
            cors_allowed_origins: corsAllowedOrigins,
            laddr: rpcListeningAddr
        }

        const p2pPartial: CometBFTP2PPartial = {
            ...joiningParams.p2p,
            external_address: exposedP2pEndpoint,
        }

        const cometbftConfig: CometBFTConfigPartial = {
            moniker,
            proxy_app: proxyApp,
            rpc: v.parse(CometBFTRpcSchema, rpcPartial),
            p2p: v.parse(CometBFTP2PSchema, p2pPartial),
            statesync: v.parse(CometBFTStateSyncSchema, joiningParams.stateSync),
            consensus: v.parse(CometBFTConsensusSchema, {
                create_empty_blocks_interval: await this.getCometbftEmptyMicroblockCreationInterval()
            })
        }

        const params: NodeConfigGenerationParams = {
            home: this.ensureHome(),
            genesisJson: joiningParams.genesisObject,
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

    private async askJoinParams(chosenRpcEndpointToRecoverGenesisSnapshot: NetworkNode, chosenNetworkName: string, chosenNetwork: Network): Promise<NetworkJoinParams> {
        const nodeService = new NodeInfoService();
        const nodes = await nodeService.listNodesInNetwork(chosenNetworkName, chosenNetwork);


        // ask the user to select seeds and persistent peers
        const seedPeers: NetworkNode[] = await this.askSeedPeersP2pTcpEndpoint(nodes);
        const persistentPeers: NetworkNode[] = await this.askPersistentPeersRcpTcpEndpoint(nodes);

        const fetcher = NodeInfoFetcher.createFromNode(chosenRpcEndpointToRecoverGenesisSnapshot);
        const specifiedTrustHeight = await this.askTrustHeight();

        // ask for state-sync
        let possibleRpcServers = nodes.filter(node => !node.isSeed);
        let chosenRpcServersForStateSync: NetworkNode[] = [];
        let trustHeight, trustHash;
        let enableStateSync = false;
        const canEnableStateSync = possibleRpcServers.length >= 2;
        if (!canEnableStateSync) {
            console.warn("Not enough real nodes found to enable state sync, skipping state sync configuration.");
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

        // load the genesis from it
        const genesis = await fetcher.fetchGenesisObject();
        if (genesis === undefined) throw new Error('Genesis not provided by the RPC node.')

        // halt if trust height or trust hash undefined
        if (trustHeight === undefined || trustHash === undefined) {
            trustHash = ''
            trustHeight = 0
        }

        return {
            p2p: {
                persistent_peers: persistentPeers
                    .map((node: NetworkNode) => this.formatPersistentPeerForP2p(node))
                    .join(',')
            },
            stateSync: {
                enable: enableStateSync,
                trust_height: trustHeight,
                trust_hash: trustHash,
                rpc_servers: seedPeers
                    .map((node: NetworkNode) => this.formatRpcServersForStateSync(node))
                    .join(',')
            },
            enableStateSync,
            trustHash: trustHash !== undefined ? trustHash : "",
            trustHeight: trustHeight !== undefined ? trustHeight : 0,
            genesisObject: genesis
        }
    }

    private formatRpcServersForStateSync(node: NetworkNode) {
        return `${node.nodeId}@${node.hostname}:26656`;
    }

    private formatPersistentPeerForP2p(node: NetworkNode) {
        return `${node.nodeId}@${node.hostname}:26656`
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
}