import { NodeConfigGenerationParams} from "./NodeConfigGenerator";
import {confirm} from "@inquirer/prompts";
import {input, select, checkbox} from "@inquirer/prompts";
import {CryptoEncoderFactory} from "@cmts-dev/carmentis-sdk/client";
import {EndpointTransformer} from "../../utils/EndpointTransformer";
import path from "node:path";
import {NetworksStore} from "../networksStore";
import {NodeInfo, NodeInfoService} from "../nodeInfo";
import {NodeInfoFetcher} from "../../utils/NodeInfoFetcher";
import {CometbftConfig} from "../CometBFTConfigGenerator";
import {join} from "path";
import {CMTSToken} from "@cmts-dev/carmentis-sdk/server";

type NetworkJoinParams = {
    persistentPeersRpcTcpEndpoint: NodeInfo[];
    seeds: NodeInfo[];
    enableStateSync: boolean;
    trustHeight: number;
    trustHash: string;
    genesis: object;
    chosenPeerToRecoverGenesisSnapshot: NodeInfo,
    chosenPeersForStateSync: NodeInfo[]
}

type NetworkCreationParams = {
    genesisPrivateKey: string;
    createdNetworkName: string
}

export class NodeConfigParamsResolver {
    static resolveParams(options: any) {
        const resolver = new NodeConfigParamsResolver(options);
        return resolver.generateParams();
    }

    constructor(private readonly options: any, private readonly  store = new NetworksStore()) {}

    private async generateParams() {
        const moniker = await this.askMoniker();
        const hostDomainName = await this.askNodeDomainName();
        // ask for minimum gas
        const minMicroblockGasInAtomicAccepted = await this.askMinimumGasPriceAccepted();
        const network = await this.askNetwork();

        const exposedRpcEndpoint = await this.askExposedRpcEndpoint(hostDomainName);
        const exposedP2pEndpoint = await this.askExternalP2PAddr(hostDomainName);
        const isJoining = await this.askIsJoiningExistingNetwork();
        const joiningParams = isJoining ? await this.askJoinParams() : undefined;
        const creationParams = isJoining ? undefined : await this.askCreationParams();

        // deduce the exposed RPC domain name
        const transformer = new EndpointTransformer(exposedRpcEndpoint);
        const exposedRpcDomainName = transformer.extractDomainName();

        // cometbft-related config-independent config variables
        const cors = await this.askCors();
        const corsAllowedOrigins = cors;
        const proxyApp = "tcp://node-abci:26658";
        const rpcListeningAddr = "tcp://0.0.0.0:26657"



        const params: NodeConfigGenerationParams = {
            home: this.ensureHome(),
            shouldDownload: {
                caddyFile: true,
                dockerCompose: true,
            },
            network: network,
            abciConfig: {
                home: this.getAbciHome(),
                exposedRpcEndpoint: exposedRpcEndpoint,
                exposedRpcDomainName: exposedRpcDomainName,
                genesis: creationParams ? { sk: creationParams.genesisPrivateKey } : undefined,
                genesis_snapshot: joiningParams ? { fromRpcEndpoint: joiningParams.chosenPeerToRecoverGenesisSnapshot.rpcEndpoint } : undefined,
                nodeConfigFilename: 'config.toml',
                min_microblock_gas_price_in_atomics: minMicroblockGasInAtomicAccepted,
            },
            cometbftConfig: {
                cors: {
                    allowedOrigins: corsAllowedOrigins
                },
                persistentPeers: joiningParams !== undefined ? joiningParams.persistentPeersRpcTcpEndpoint : [],
                seeds: joiningParams !== undefined ? joiningParams.seeds : [],
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
                p2p: {
                    externalAddress: exposedP2pEndpoint
                },
                stateSync: joiningParams !== undefined ? {
                    enabled: joiningParams.enableStateSync,
                    trustHeight: joiningParams.trustHeight,
                    trustHash: joiningParams.trustHash,
                    rpcServers: joiningParams.chosenPeersForStateSync
                } : undefined,
                mempool: {
                    createEmptyBlocksInterval: '30s'
                }
            }
        };
        return params;
    }

    private async askMinimumGasPriceAccepted() {
        const minGas = await input({
            message: 'You have the possibility to reject microblocks having lower than a specified gas price.\nBy default, this value is 1 aCMTS (all microblocks are considered). Enter your minimum gas price accepted by the node (e.g., 0.1 CMTS, 100 aCMTS):',
            default: "1 aCMTS",
            validate: (value: string) => {
                CMTSToken.parse(value);
                return true;
            }
        })
        return CMTSToken.parse(minGas).getAmountAsAtomic();
    }

    private async askNodeDomainName() {
        return input({
            message: 'Enter the domain name of your node (my-node.example.com):',
            required: true,
            validate: (value: string) => {
                const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
                return domainRegex.test(value) ? true : 'Invalid domain name format';
            }
        });
    }

    private async askSeedPeersP2pTcpEndpoint(nodes: NodeInfo[]): Promise<NodeInfo[]> {
        // load the endpoints and raise a message if no seed available
        const endpoints = nodes.filter(node => node.isSeed);
        if (endpoints.length === 0) {
            console.log("No seed nodes found, skipping seed peers selection.");
            return [];
        }

        const chosenNodes =  await checkbox<NodeInfo>({
            choices: endpoints.map(node => ({ name: node.hostname, value: node })),
            message: 'Select seed peers (used to discover new peers in the network, highly recommended):',
        });
        return chosenNodes;
    }

    private async askPersistentPeersRcpTcpEndpoint(nodes: NodeInfo[]): Promise<NodeInfo[]> {
        const nonSeedPeers = nodes.filter(node => !node.isSeed);
        const chosenNodes =  await checkbox<NodeInfo>({
            choices: nonSeedPeers.map(node => ({ name: node.hostname, value: node })),
            message: 'Select persistent peers (that will remain connected to your node):',
        });
        return chosenNodes;
    }

    private async askJoinParams(): Promise<NetworkJoinParams | undefined> {
        // ask the user to select a network to join and load endpoints from the chosen networks
        const networkNames = await this.store.getNetworkNames();
        const chosenNetworkName = await this.askChoiceAmongKnownNetworks(networkNames);
        const nodeService = new NodeInfoService();
        const nodes = await nodeService.listNodesInNetwork(this.store, chosenNetworkName);


        // ask the user to select seeds and persistent peers
        const seedPeers = await this.askSeedPeersP2pTcpEndpoint(nodes);
        const persistentPeers = await this.askPersistentPeersRcpTcpEndpoint(nodes);

        // ask for trust height
        const chosenRpcEndpoint = await this.askToChooseNodeToRecoverGenesisSnapshot(
            nodes
        );
        const fetcher = new NodeInfoFetcher(chosenRpcEndpoint.rpcEndpoint);
        const specifiedTrustHeight = await this.askTrustHeight();

        // ask for state-sync
        let possibleRpcServers = nodes.filter(node => !node.isSeed);
        let chosenRpcServersForStateSync: NodeInfo[] = [];
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
                    const fetcher = new NodeInfoFetcher(chosenRpcServer.rpcEndpoint);

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
        const genesis = await fetcher.fetchGenesis();
        if (genesis === undefined) throw new Error('Genesis not provided by the RPC node.')

        return {
            persistentPeersRpcTcpEndpoint: persistentPeers,
            seeds: seedPeers,
            enableStateSync,
            trustHash: trustHash !== undefined ? trustHash : "",
            trustHeight: trustHeight !== undefined ? trustHeight : 0,
            genesis: genesis,
            chosenPeerToRecoverGenesisSnapshot: chosenRpcEndpoint,
            chosenPeersForStateSync: chosenRpcServersForStateSync
        }
    }

    private async askRpcServersForStateSync(nodes: NodeInfo[]) {
        const rpcServers = nodes.filter(node => !node.isSeed);//.map(node => node.rpcEndpoint);
        const chosenRpcServers = await checkbox<NodeInfo>({
            choices: rpcServers.map(node => ({ name: node.rpcEndpoint, value: node })),
            message: 'Select RPC servers to use for state sync:',
        });
        return chosenRpcServers;
    }


    private async askCreationParams(): Promise<NetworkCreationParams | undefined> {
        const networkName = await this.askNetworkNameToCreate();
        const sk = await this.askGenesisPrivateKey();
        return {
            createdNetworkName: networkName, genesisPrivateKey: sk
        }
    }

    private ensureHome() {
        const home = this.options.home;
        if (typeof home !== "string") throw new Error(`${home} is not provided but is required`);
        return path.resolve(home);
    }


    private getAbciHome(): string {
        return this.options.home;
    }

    private  async askIsJoiningExistingNetwork() {
        return (typeof this.options.join === 'boolean' && this.options.join) || confirm({
            message: 'Are you joining an existing network?',
            default: true
        });
    }

    private askMoniker() {
        return (
            this.options.moniker ||
            input({
                message: 'Enter the name of your node',
                required: true,
                validate: (value: string) => typeof value === 'string' && value.length > 0 && value.trim().length > 0,
            })
        );
    }

    private async askCors() {
        let cors = ["*"]
        let agreed = false;
        let shouldAskIfOk = true;
        do {
            if (shouldAskIfOk) {
                agreed = await confirm({
                    message: `Are you satisfied with the following cors configuration: ${JSON.stringify(cors) || '(none)'}?`,
                });
            }


            if (!agreed) {
                const formattedCors = await input({
                    message: "Enter entries for your CORS configuration (separated by commas):",
                    validate: (value: string) => typeof value === 'string' && value.length > 0 && value.trim().length > 0,
                });
                try {
                    const corsEntries = formattedCors.split(',').map(entry => entry.trim());
                    cors = corsEntries.filter(entry => entry.length > 0);
                    shouldAskIfOk =  true;
                } catch (e) {
                    console.error("Invalid CORS configuration format. Please enter valid domain entries separated by commas.");
                    shouldAskIfOk = false;
                }
            }
        } while (!agreed);

        return cors;
    }

    private askExposedRpcEndpoint(nodeDomainName: string) {
        return (
            this.options.exposedRpcEndpoint ||
            input({
                message: 'Enter the endpoint where one can contact the RPC interface of your node (https://example.com or http://example.com:26657):',
                required: true,
                default: `https://${nodeDomainName}`,
                validate: (value: string) => {
                    const transformer = new EndpointTransformer(value);
                    return transformer.isHttpOrHttpsEndpoint();
                },
            })
        );
    }

    private askExternalP2PAddr(nodeDomainName: string) {
        return (
            input({
                message: 'Enter the TCP endpoint where one can contact the P2P interface of your node (example: tcp://example.com:26656)',
                required: true,
                default: `tcp://${nodeDomainName}:26656`
            })
        );
    }

    private askExposedP2pEndpoint() {
        return (
            this.options.exposedP2pEndpoint ||
            input({
                message: 'Enter the endpoint where one can contact the P2P interface of your node',
                required: true,
            })
        );
    }

    private async askGenesisPrivateKey() {
        return (
            this.options.genesisPrivateKey ||
            input({
                message: 'Enter the private key used to generate the genesis state',
                required: true,
                validate: (value: string) => {
                    const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
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



    private async askNetworkNameToCreate() {
        return input({
            message: 'Enter the name of the network you want to create:',
            required: true,
        });
    }


    private askChoiceAmongKnownNetworks(networks: string[]) {
        return select<string>({
            message: 'Select the network you want to join',
            choices: networks,
        });
    }

    private async askToChooseNodeToRecoverGenesisSnapshot(nodes: NodeInfo[]) {
        const endpoints = nodes.filter(node => !node.isSeed);//.map(node => node.rpcEndpoint);
        return select<NodeInfo>({
            choices: endpoints.map(node => ({ name: node.rpcEndpoint, value: node })),
            message: 'Select one RPC endpoint to recover the genesis snapshot (used only during block-sync, not during state-sync):',
            default: endpoints[0],
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

    private getCometbftHome() {
        return join(this.options.home, 'cometbft');
    }

    private async askNetwork() {
        return select<string>({
            message: 'Select the network:',
            choices: [
                { name: 'devnet', value: 'devnet' },
                { name: 'testnet', value: 'testnet' }
            ],
            default: 'testnet'
        });
    }

}