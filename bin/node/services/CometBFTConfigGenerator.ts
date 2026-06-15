
import { CometBFTBinary } from './CometBFTBinary';
import { join } from 'path';
import { TomlEditor } from '../utils/TomlEditor';
import { JsonEditor } from '../utils/JsonEditor';
import { JsonExporter } from '../utils/JsonExporter';
import {CometBFTConfig} from "../types/CometbftConfig";
/*
export interface CometBFTStateSync {
    enabled: boolean;
    trustHeight: number;
    trustHash: string;
    rpcServers: NodeInfo[];
}
export interface CometbftConfig {
    home: string;
    moniker: string;
    persistentPeers: NodeInfo[],
    seeds: NodeInfo[],
    genesis: { overrideWith?: object, networkName?: string },
    stateSync?: CometBFTStateSync,
    cors: {
        allowedOrigins: string[],
    },
    proxyApp: string,
    rpc: {
        laddr: string,
    },
    p2p: {
        externalAddress: string,
    },
    mempool: {
        createEmptyBlocksInterval?: string,
    }
}

 */

export class CometBFTConfigGenerator {


    private configTomlEditor: TomlEditor;
    private genesisEditor: JsonEditor;

    constructor(
        private readonly home: string,
        private readonly networkName: string,
        private readonly params: CometBFTConfig,
        private readonly options: { genesisJson?: object },
    ) {
        this.configTomlEditor = new TomlEditor(this.configFilePath);
        this.genesisEditor = new JsonEditor(this.genesisPath);
    }

    async generateConfig() {
        // execute cometbft init
        CometBFTBinary.executeInit(this.cometbftHome);

        // update genesis
        if (this.options.genesisJson) {
            JsonExporter.exportAt(this.options.genesisJson, this.genesisPath);
        } else if (this.networkName) {
            console.log("network name: " + this.networkName);
            this.genesisEditor.write(['chain_id'], this.networkName);
        }

        // write top-level params
        for (const [key, value] of Object.entries(this.params)) {
            if (typeof value !== 'object') {
                console.log(`Writing ${key}=${value} to config.toml`);
                this.configTomlEditor.write(key, value);
            }
        }

        // write consensus
        const consensus = this.params.consensus;
        for (const [key, value] of Object.entries(consensus)) {
            console.log(`Writing consensus.${key}=${value} to config.toml`);
            this.configTomlEditor.write(key, value, "consensus");
        }

        // write p2p
        const p2p = this.params.p2p;
        for (const [key, value] of Object.entries(p2p)) {
            console.log(`Writing p2p.${key}=${value} to config.toml`);
            this.configTomlEditor.write(key, value, "p2p");
        }

        // write statesync
        const statesync = this.params.statesync;
        for (const [key, value] of Object.entries(statesync)) {
            console.log(`Writing statesync.${key}=${value} to config.toml`);
            this.configTomlEditor.write(key, value, "statesync")
        }

        // write rpc
        const rpc = this.params.rpc;
        for (const [key, value] of Object.entries(rpc)) {
            console.log(`Writing rpc.${key}=${value} to config.toml`);
            this.configTomlEditor.write(key, value, "rpc");
        }

        /*
        // update config
        this.writeMoniker(this.moniker);

        // update proxy app
        this.configTomlEditor.write("proxy_app", this.params.proxy_app)
        this.configTomlEditor.write("laddr", this.params.rpc?.laddr,"rpc")

        // update p2p external address
        const providedExternalAddress = this.params.p2p.external_address.toLowerCase();
        const externalLaddr = this.formatExternalAddress(providedExternalAddress);
        this.configTomlEditor.write("external_address", externalLaddr, "p2p");

        // update empty block interval
        const createEmptyBlocksInterval = this.params.consensus.create_empty_blocks_interval;
        this.configTomlEditor.write("create_empty_blocks_interval", createEmptyBlocksInterval, "mempool");

        // update persistent peers
        const persistentPeers = this.params.p2p.persistent_peers;
        if (persistentPeers.length > 0) {
            this.configTomlEditor.write("persistent_peers", persistentPeers, "p2p");
        } else {
            console.warn("No persistent peers found: skipping persistent peers configuration");
        }

        // update seeds
        const seeds = this.params.p2p.seeds;
        const seedEndpoints = seeds.split(',')
        if (seeds && seedEndpoints.length > 0) {
            this.configTomlEditor.write("seeds", seedEndpoints, "p2p");
            console.log(`✅ Configured ${seedEndpoints.length} seed node(s)`);
        }

        if (this.options.genesisJson) {
            JsonExporter.exportAt(this.options.genesisJson, this.genesisPath);
        } else if (this.networkName) {
            console.log("network name: " + this.networkName);
            this.genesisEditor.write(['chain_id'], this.networkName);
        }

        // update cors
        this.writeCors(this.params.rpc.cors_allowed_origins);

        // update rpc servers
        if (this.params.statesync.enable) {
            const rpcServers = this.params.statesync.rpc_servers;
            const { trust_height, trust_hash } = this.params.statesync;
            this.configTomlEditor.write("enable", true, "statesync");
            this.configTomlEditor.write("rpc_servers", rpcServers, 'statesync');
            this.configTomlEditor.write("trust_height", trust_height, 'statesync');
            this.configTomlEditor.write("trust_hash", trust_hash, 'statesync');
            //this.enableRpcServersForStateSync(rpcServers, trustHeight, trustHash);
        }

         */
    }

    private writeCors(allowedOrigins: string[]) {
        this.configTomlEditor.write("cors_allowed_origins", allowedOrigins,"rpc");
    }


    private writeMoniker(moniker: string) {
        this.configTomlEditor.write("moniker", moniker);
    }

    private get moniker() {
        return this.params.moniker
    }

    private getPersistentPeers() {
        return this.params.p2p.persistent_peers;
    }

    /*
    private getRpcNodes() {
        if (!!this.params.statesync.enable) return [];

    }

    private getSeedP2pTcpEndpoint(): string[] {
        return this.params.seeds.map(seed => this.formatSeedP2pTcpEndpoint(seed));
    }

     */

    private get cometbftHome() {
        return this.home;
    }

    private get genesisPath() {
        return join(this.cometbftHome, 'config', 'genesis.json');
    }

    private get configFilePath() {
        return join(this.cometbftHome, 'config', 'config.toml');
    }


    /*
    private formatPersistentPeerAddress(node: NodeInfo) {
        return `${node.nodeId}@${node.hostname}:26656`
    }


    private formatSeedP2pTcpEndpoint(node: NodeInfo) {
        return `${node.nodeId}@${node.hostname}:26656`
    }

     */

    /**
     * The format for an external address is tcp://<external-address>:<p2p-port>
     * @param externalAddress
     * @private
     */
    private formatExternalAddress(externalAddress: string) {
        const startWithTcp = externalAddress.startsWith('tcp://');
        const endsWithDefaultP2pPort = externalAddress.endsWith(':26656');
        if (startWithTcp && endsWithDefaultP2pPort) return externalAddress;
        if (startWithTcp && !endsWithDefaultP2pPort) return `${externalAddress}:26656`;
        if (!startWithTcp && endsWithDefaultP2pPort) return `tcp://${externalAddress}`;
        return `tcp://${externalAddress}:26656`;
    }

    /*
    private formatStateSyncRpcServerFromNode(node: NodeInfo) {
        return `tcp://${node.hostname}:26657`
    }
    */
}

