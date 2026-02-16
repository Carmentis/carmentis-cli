
import { CometBFTBinary } from './CometBFTBinary';
import { join } from 'path';
import { TomlEditor } from '../utils/TomlEditor';
import { JsonEditor } from '../utils/JsonEditor';
import { JsonExporter } from '../utils/JsonExporter';
import {NodeInfo} from "./nodeInfo";

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

        // update p2p external address
        const providedExternalAddress = this.params.p2p.externalAddress.toLowerCase();
        const externalLaddr = this.formatExternalAddress(providedExternalAddress);
        this.configTomlEditor.write("external_address", externalLaddr, "p2p");

        // update empty block interval
        const createEmptyBlocksInterval = this.params.mempool.createEmptyBlocksInterval ?? '30s';
        this.configTomlEditor.write("create_empty_blocks_interval", createEmptyBlocksInterval, "mempool");

        // update persistent peers
        const persistentPeers = this.getPersistentPeers().map(node => this.formatPersistentPeerAddress(node));
        if (persistentPeers.length > 0) {
            this.configTomlEditor.write("persistent_peers", persistentPeers.join(","), "p2p");
        } else {
            console.warn("No persistent peers found: skipping persistent peers configuration");
        }

        // update seeds
        const seeds = this.getSeedP2pTcpEndpoint();
        if (seeds && seeds.length > 0) {
            const seedsString = this.params.seeds.map(seed => this.formatSeedP2pTcpEndpoint(seed)).join(",");
            this.configTomlEditor.write("seeds", seedsString, "p2p");
            console.log(`✅ Configured ${this.params.seeds.length} seed node(s)`);
        }

        if (this.params.genesis.overrideWith) {
            JsonExporter.exportAt(this.params.genesis.overrideWith, this.genesisPath);
        } else if (this.params.genesis.networkName) {
            console.log("network name: " + this.params.genesis.networkName);
            this.genesisEditor.write(['chain_id'], this.params.genesis.networkName);
        }

        // update cors
        this.writeCors(this.params.cors.allowedOrigins);

        // update rpc servers
        if (this.params.stateSync !== undefined) {
            const rpcServers = this.getRpcNodes();
            const { trustHeight, trustHash } = this.params.stateSync;
            this.enableRpcServersForStateSync(rpcServers, trustHeight, trustHash);
        }
    }

    private writeCors(allowedOrigins: string[]) {
        this.configTomlEditor.write("cors_allowed_origins", allowedOrigins,"rpc");
    }

    private enableRpcServersForStateSync(rpcServers: NodeInfo[], trustHeight: number, trustHash: string) {
        const rpcEndpoints = rpcServers.map(node => this.formatStateSyncRpcServerFromNode(node));
        const rpcServersConfig = rpcEndpoints.join(",")
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

    private getPersistentPeers() {
        return this.params.persistentPeers;
    }

    private getRpcNodes() {
        if (this.params.stateSync === undefined) return [];
        const stateSync = this.params.stateSync;
        return stateSync.rpcServers;
    }

    private getSeedP2pTcpEndpoint(): string[] {
        return this.params.seeds.map(seed => this.formatSeedP2pTcpEndpoint(seed));
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


    /**
     * The format for a persistent peer address is <node-id>@<hostname>:26656
     * @param node
     * @private
     */
    private formatPersistentPeerAddress(node: NodeInfo) {
        return `${node.nodeId}@${node.hostname}:26656`
    }

    /**
     * The format for a seed peer address is <node-id>@<hostname>:26656
     * @param node
     * @private
     */
    private formatSeedP2pTcpEndpoint(node: NodeInfo) {
        return `${node.nodeId}@${node.hostname}:26656`
    }

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

    /**
     * The format for a state sync RPC server is tcp://<hostname>:<rpc-port>
     * @param node
     * @private
     */
    private formatStateSyncRpcServerFromNode(node: NodeInfo) {
        return `tcp://${node.hostname}:26657`
    }
}

