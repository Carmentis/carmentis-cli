import { NodeConfigGenerationParams} from "./NodeConfigGenerator";
import {confirm} from "@inquirer/prompts";
import {input, select} from "@inquirer/prompts";
import {StringSignatureEncoder} from "@cmts-dev/carmentis-sdk/client";
import {EndpointTransformer} from "../../utils/EndpointTransformer";
import path from "node:path";
import {CometBFTEndpointAccumulator} from "../cometBFTEndpointAccumulator";
import {NetworksStore} from "../networksStore";
import {NodeInfoService} from "../nodeInfo";
import {NodeInfoFetcher} from "../../utils/NodeInfoFetcher";
import {CometbftConfig} from "../CometBFTConfigGenerator";
import {join} from "path";

type NetworkJoinParams = {
    joinedNetworkEndpoints: CometBFTEndpointAccumulator;
    enableStateSync: boolean;
    trustHeight: number;
    trustHash: string;
    genesis: object;
    chosenRpcEndpoint: string
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
        const exposedRpcEndpoint = await this.askExposedRpcEndpoint();
        const isJoining = await this.askIsJoiningExistingNetwork();
        const joiningParams = isJoining ? await this.askJoinParams() : undefined;
        const creationParams = isJoining ? undefined : await this.askCreationParams();
        const emptyInitialEndpointsSet = new CometBFTEndpointAccumulator();

        // deduce the exposed RPC domain name
        const transformer = new EndpointTransformer(exposedRpcEndpoint);
        const exposedRpcDomainName = transformer.extractDomainName();

        // cometbft-related config-independent config variables
        const corsAllowedOrigins = ["*"];
        const proxyApp = "tcp://node-abci:26658";
        const rpcListeningAddr = "tcp://0.0.0.0:26657"


        const params: NodeConfigGenerationParams = {
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

    private async askJoinParams(): Promise<NetworkJoinParams | undefined> {
        // if the user has provided rpc nodes, then use it, otherwise ask for name
        let endpoints : CometBFTEndpointAccumulator;
        const hasSpecifiedEndpoints = typeof this.options.joinedNetworkEndpoints !== 'undefined';
        if (hasSpecifiedEndpoints) {
            endpoints = new CometBFTEndpointAccumulator();
            for (const endpoint of this.options.joinedNetworkEndpoints) {
                await endpoints.parseEndpoint(endpoint);
            }
        } else {
            // ask the user to select a network to join
            const networkNames = await this.store.getNetworkNames();
            const chosenNetworkName = await this.askChoiceAmongKnownNetworks(networkNames);

            // load endpoints from the chosen networks
            const nodeService = new NodeInfoService();
            const nodes = await nodeService.listNodesInNetwork(this.store, chosenNetworkName);
            endpoints = new CometBFTEndpointAccumulator();
            for (const node of nodes) {
                if (node.nodeId) {
                    await endpoints.addRpcEndpoint(node.rpcEndpoint);
                    await endpoints.addP2PEndpoint(`${node.nodeId}@${node.p2pEndpoint}`);
                } else {
                    console.warn(`Node ${node.hostname} seems offline, skipping this node`);
                }
            }
        }


        // ask for trust height
        const chosenRpcEndpoint = await this.askToChooseEndpointToRecoverGenesisSnapshot(
            endpoints.getRpcEndpoints(),
        );
        const fetcher = new NodeInfoFetcher(chosenRpcEndpoint);
        const specifiedTrustHeight = await this.askTrustHeight();

        // update rpc servers
        const rpcServers = endpoints.getRpcEndpoints();
        let trustHeight, trustHash;
        let enableStateSync = false;
        if (rpcServers.length >= 2) {
            // if the provided trust height is 'last', use the first servers
            const chosenRpcServer = rpcServers[0];
            const fetcher = new NodeInfoFetcher(chosenRpcServer);

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
        } else {
            console.warn(`No sufficient RPC servers provided (${rpcServers.length} provided), cannot enable state sync`);
        }

        // load the genesis from it
        const genesis = await fetcher.fetchGenesis();
        if (genesis === undefined) throw new Error('Genesis not provided by the RPC node.')

        return {
            joinedNetworkEndpoints: endpoints,
            enableStateSync,
            trustHash: trustHash !== undefined ? trustHash : "",
            trustHeight: trustHeight !== undefined ? trustHeight : 0,
            genesis: genesis,
            chosenRpcEndpoint: chosenRpcEndpoint
        }
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

    private askExposedRpcEndpoint() {
        return (
            this.options.exposedRpcEndpoint ||
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

    private async askGenesisPrivateKey() {
        return (
            this.options.genesisPrivateKey ||
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

}