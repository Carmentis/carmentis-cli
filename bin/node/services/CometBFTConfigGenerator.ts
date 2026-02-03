import { CometBFTEndpointAccumulator } from './cometBFTEndpointAccumulator';
import { CometBFTBinary } from './CometBFTBinary';
import { join } from 'path';
import { TomlEditor } from '../utils/TomlEditor';
import { NodeInfoFetcher } from '../utils/NodeInfoFetcher';
import { JsonEditor } from '../utils/JsonEditor';
import { JsonExporter } from '../utils/JsonExporter';

export interface CometBFTStateSync {
    enabled: boolean;
    trustHeight: number;
    trustHash: string;
}
export interface CometbftConfig {
    home: string;
    moniker: string;
    endpoints: CometBFTEndpointAccumulator,
    seeds?: string[],
    genesis: { overrideWith?: object, networkName?: string },
    stateSync?: CometBFTStateSync,
    cors: {
        allowedOrigins: string[],
    },
    proxyApp: string,
    rpc: {
        laddr: string,
    },
    mempool: {
        createEmptyBlocksInterval?: string,
    }
}

export class CometBFTConfigGenerator {
    private configTomlEditor: TomlEditor;
    private genesisEditor: JsonEditor;

    constructor(
        private readonly params: CometbftConfig
    ) {
        this.configTomlEditor = new TomlEditor(this.configFilePath);
        this.genesisEditor = new JsonEditor(this.genesisPath);
    }

    async generateConfig() {
        // execute cometbft init
        CometBFTBinary.executeInit(this.cometbftHome);

        this.writeMoniker(this.moniker);

        // update proxy app
        this.configTomlEditor.write("proxy_app", this.params.proxyApp)
        this.configTomlEditor.write("laddr", this.params.rpc.laddr,"rpc")

        // update empty block interval
        const createEmptyBlocksInterval = this.params.mempool.createEmptyBlocksInterval ?? '30s';
        this.configTomlEditor.write("create_empty_blocks_interval", createEmptyBlocksInterval, "mempool");

        // update persistent peers
        const p2pEndpoints = this.endpoints.getP2PEndpoints();
        if (p2pEndpoints.length > 0) {
            const persistentPeers = this.endpoints.getP2PEndpoints().join(',')
            this.configTomlEditor.write("persistent_peers", persistentPeers, "p2p");
        } else {
            console.warn("No p2p endpoints found: skipping persistent peers");
        }

        // update seeds
        if (this.params.seeds && this.params.seeds.length > 0) {
            const seedsString = this.params.seeds.join(',');
            this.configTomlEditor.write("seeds", seedsString, "p2p");
            console.log(`✅ Configured ${this.params.seeds.length} seed node(s)`);
        }

        if (this.params.genesis.overrideWith) {
            JsonExporter.exportAt(this.params.genesis.overrideWith, this.genesisPath);
        } else if (this.params.genesis.networkName) {
            console.log("network name: " + this.params.genesis.networkName);
            this.genesisEditor.write(['chain_id'], this.params.genesis.networkName);
        }

        // update rpc servers
        const rpcServers = this.endpoints.getRpcEndpoints();
        this.writeCors(this.params.cors.allowedOrigins);

        const hasEnoughRPCServers = rpcServers.length >= 2;
        const isStateSyncEnabled = this.params.stateSync !== undefined && this.params.stateSync.enabled;
        if (hasEnoughRPCServers && isStateSyncEnabled && this.params.stateSync !== undefined) {
            const { trustHeight, trustHash } = this.params.stateSync;
            this.enableRpcServers(rpcServers, trustHeight, trustHash);
        } else {
            console.warn(`No sufficient RPC servers provided (${rpcServers.length} provided) or state sync not enabled: state sync disabled`);
        }
    }

    private writeCors(allowedOrigins: string[]) {
        this.configTomlEditor.write("cors_allowed_origins", allowedOrigins,"rpc");
    }

    private enableRpcServers(rpcServers: string[], trustHeight: number, trustHash: string) {
        const rpcServersConfig = rpcServers.join(",")
        this.configTomlEditor.write("enable", true, "statesync");
        this.configTomlEditor.write("rpc_servers", rpcServersConfig, 'statesync');
        this.configTomlEditor.write("trust_height", trustHeight, 'statesync');
        this.configTomlEditor.write("trust_hash", trustHash, 'statesync');
    }

    private writeMoniker(moniker: string) {
        this.configTomlEditor.write("moniker", moniker);
    }

    private get moniker() {
        return this.params.moniker
    }

    private get endpoints() {
        return this.params.endpoints;
    }

    private get cometbftHome() {
        return this.params.home;
    }

    private get genesisPath() {
        return join(this.cometbftHome, 'config', 'genesis.json');
    }

    private get configFilePath() {
        return join(this.cometbftHome, 'config', 'config.toml');
    }
}

