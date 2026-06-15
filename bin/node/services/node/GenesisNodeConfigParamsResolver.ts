import { NodeConfigGenerationParams} from "./NodeConfigGenerator";
import {confirm} from "@inquirer/prompts";
import {input, select, checkbox} from "@inquirer/prompts";
import {CryptoEncoderFactory} from "@cmts-dev/carmentis-sdk/client";
import {EndpointTransformer} from "../../utils/EndpointTransformer";
import path from "node:path";
import {NetworksStore} from "../networksStore";
import {AbstractNodeConfigParamsResolver} from "./AbstractNodeConfigParamsResolver";
import {CometBFTConfigSchema} from "../../types/CometbftConfig";
import * as v from 'valibot';

type NetworkCreationParams = {
    genesisPrivateKey: string;
    createdNetworkName: string
}

export class GenesisNodeConfigParamsResolver extends AbstractNodeConfigParamsResolver {

    static resolveParams(options: any) {
        const resolver = new GenesisNodeConfigParamsResolver(options);
        return resolver.generateParams();
    }

    constructor(options: any, private readonly  store = new NetworksStore()) {
        super(options)
    }

    private async generateParams() {
        const moniker = await this.askMoniker();
        const hostDomainName = await this.askNodeDomainName();
        // ask for minimum gas
        const minMicroblockGasInAtomicAccepted = await this.askMinimumGasPriceAccepted();
        const networkName = await this.askNetworkNameToCreate();
        const networksStore = new NetworksStore();
        const network = await networksStore.getNetworkByName(networkName);

        const exposedRpcEndpoint = await this.askExposedRpcEndpoint(hostDomainName);
        const exposedP2pEndpoint = await this.askExternalP2PAddr(hostDomainName);
        const creationParams = await this.askCreationParams();

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
            choseNetwork: network,
            abciConfig: {
                home: this.getAbciHome(),
                exposedRpcEndpoint: exposedRpcEndpoint,
                exposedRpcDomainName: exposedRpcDomainName,
                genesis: { sk: creationParams.genesisPrivateKey },
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
                    networkName: creationParams.createdNetworkName ,
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
                consensus: {
                    createEmptyBlocksInterval: '30s'
                }
            })
        };
        return params;
    }



    private async askCreationParams(): Promise<NetworkCreationParams> {
        const networkName = await this.askNetworkNameToCreate();
        const sk = await this.askGenesisPrivateKey();
        return {
            createdNetworkName: networkName, genesisPrivateKey: sk
        }
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



}