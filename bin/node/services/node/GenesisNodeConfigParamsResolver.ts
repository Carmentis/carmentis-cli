import { NodeConfigGenerationParams} from "./NodeConfigGenerator";
import {confirm} from "@inquirer/prompts";
import {input, select, checkbox} from "@inquirer/prompts";
import {CryptoEncoderFactory, Secp256k1PrivateSignatureKey} from "@cmts-dev/carmentis-sdk/client";
import {EndpointTransformer} from "../../utils/EndpointTransformer";
import path from "node:path";
import {NetworksStore} from "../networksStore";
import {AbstractNodeConfigParamsResolver} from "./AbstractNodeConfigParamsResolver";
import {CometBFTConfigSchema} from "../../types/CometbftConfig";
import * as v from 'valibot';
import {Network} from "../../types/NetworksFile";

type NetworkCreationParams = {
    genesisPrivateKey: string;
}

export class GenesisNodeConfigParamsResolver extends AbstractNodeConfigParamsResolver {

    static resolveParams(options: any) {
        const resolver = new GenesisNodeConfigParamsResolver(options);
        return resolver.generateParams();
    }

    constructor(options: any, private readonly  store = new NetworksStore()) {
        super(options)
    }

    private askAbciLabel() {
        return select<string>({
            choices: ['mainnet', 'testnet', 'devnet'],
            message: 'Select the ABCI Docker image label to use for the network:',
            default: 'devnet'
        })
    }

    private async generateParams() {



        // ask for the network name
        const networkName = await this.askNetworkNameToCreate();


        // ensure the network not already defined locally
        const networksStore = new NetworksStore();
        const network = await networksStore.getNetworkByName(networkName);
        if (network !== undefined) {
            throw new Error(`A network with name ${networkName} already exists`)
        }

        // information about the node
        const moniker = await this.askMoniker();
        const hostDomainName = await this.askNodeDomainName();
        const exposedRpcEndpoint = await this.askExposedRpcEndpoint(hostDomainName);
        const exposedP2pEndpoint = await this.askExternalP2PAddr(hostDomainName);
        const sk = await this.askGenesisPrivateKey();
        const abciDockerImageLabel = await this.askAbciLabel();

        // create the network
        const createdNetwork: Network = {
            abciDockerImageLabel: abciDockerImageLabel,
            nodes: {
                moniker: {
                    hostname: hostDomainName,
                    rpcEndpoint: exposedRpcEndpoint,
                    p2pEndpoint: exposedP2pEndpoint,
                    nodeId: "", // we do not have node id yet,
                    isSeed: false,
                    isGenesis: true,
                }
            }
        }


        // ask for minimum gas
        const minMicroblockGasInAtomicAccepted = await this.askMinimumGasPriceAccepted();


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
            },
            genesisJson: undefined,
            networkName: networkName,
            choseNetwork: createdNetwork,
            abciConfig: {
                home: this.getAbciHome(),
                exposedRpcEndpoint: exposedRpcEndpoint,
                exposedRpcDomainName: exposedRpcDomainName,
                genesis: { sk },
                genesis_snapshot_origin:  undefined,
                abciConfigFilename: 'config.toml',
                min_microblock_gas_price_in_atomics: minMicroblockGasInAtomicAccepted,
            },
            cometbftConfig: v.parse(CometBFTConfigSchema, {
                cors: {
                    allowedOrigins: corsAllowedOrigins
                },
                persistentPeers: [],
                seeds:  [],
                genesis: {
                    networkName: networkName,
                    overrideWith: undefined,
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
                stateSync: undefined,
                consensus: {}
            })
        };
        return params;
    }


    private async askGenesisPrivateKey(): Promise<string> {
        // if already indicated, use it
        const privateKeyInOption = this.options.genesisPrivateKey;
        const privateKeyInEnv = process.env.GENESIS_PRIVATE_KEY;
        if (privateKeyInOption) return privateKeyInOption;
        if (privateKeyInEnv) return privateKeyInEnv;


        // otherwise, ask if the key should be generated
        const userWantsToGenerateKey = await confirm({
            message: 'Do you want to generate a new private key for the genesis state?',
            default: true,
        })
        if (userWantsToGenerateKey) {
            const sk = Secp256k1PrivateSignatureKey.gen();
            const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
            return await encoder.encodePrivateKey(sk);
        } else {
            return input({
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
        }
    }



    private async askNetworkNameToCreate() {
        return input({
            message: 'Enter the name of the network you want to create:',
            required: true,
        });
    }



}