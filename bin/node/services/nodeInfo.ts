import { NetworksFile, NetworksStore } from './networksStore';

export interface NodeInfo {
    network: string;
    hostname: string;
    rpcEndpoint: string;
    p2pEndpoint: string;
    trusted: boolean;
    isSeed: boolean;
    online: boolean;
    nodeId?: string;
}

function withDefaultEndpoints(
    hostname: string,
    node: { rpcEndpoint?: string; p2pEndpoint?: string; trusted?: boolean },
) {
    const rpcEndpoint = node.rpcEndpoint ?? `http://${hostname}:26657`;
    const p2PEndpoint = node.p2pEndpoint ?? `${hostname}:26656`;
    return { rpcEndpoint, p2PEndpoint };
}

export class NodeInfoService {
    constructor(private readonly fetchTimeoutMs: number = 1500) {}

    async list(store: NetworksFile): Promise<NodeInfo[]> {
        const items: NodeInfo[] = [];
        for (const [network, data] of Object.entries(store)) {
            for (const [hostname, node] of Object.entries(data.nodes ?? {})) {
                const { rpcEndpoint, p2PEndpoint } = withDefaultEndpoints(
                    hostname,
                    node,
                );
                items.push({
                    network,
                    hostname,
                    rpcEndpoint,
                    p2pEndpoint: p2PEndpoint,
                    trusted: Boolean(node.trusted),
                    isSeed: Boolean(node.isSeed),
                    online: false,
                });
            }
        }
        // Probe online status and node-id concurrently with timeouts
        await Promise.all(
            items.map(async (it) => {
                const result = await this.fetchStatus(it.rpcEndpoint).catch(() => undefined);
                it.online = Boolean(result);
                if (result) {
                    const id = this.extractNodeId(result);
                    if (id) it.nodeId = id;
                }
            }),
        );
        return items;
    }

    async listNodesInNetwork(store: NetworksStore, networkName: string): Promise<NodeInfo[]> {
        const nodes = await store.read();
        const items: NodeInfo[] = [];
        const data = nodes[networkName];
        for (const [hostname, node] of Object.entries(data.nodes ?? {})) {
            const { rpcEndpoint, p2PEndpoint } = withDefaultEndpoints(
                hostname,
                node,
            );
            items.push({
                network: networkName,
                hostname,
                rpcEndpoint,
                p2pEndpoint: p2PEndpoint,
                trusted: Boolean(node.trusted),
                isSeed: Boolean(node.isSeed),
                online: false,
            });
        }
        // Probe online status and node-id concurrently with timeouts
        await Promise.all(
            items.map(async (it) => {
                const result = await this.fetchStatus(it.rpcEndpoint).catch(() => undefined);
                it.online = Boolean(result);
                if (result) {
                    const id = this.extractNodeId(result);
                    if (id) it.nodeId = id;
                }
            }),
        );
        return items;
    }

    async getNodeIdFromRpcEndpoint(rpcEndpoint: string) {
        const status = await this.fetchStatus(rpcEndpoint);
        return this.extractNodeId(status);
    }

    private async fetchStatus(baseUrl: string): Promise<unknown> {
        try {
            const url = baseUrl.replace(/\/$/, '') + '/status';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.fetchTimeoutMs);
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) return undefined;
                const json = await res.json().catch(() => undefined);
                return json as unknown;
            } catch {
                clearTimeout(timeout);
                return undefined;
            }
        } catch {
            return undefined;
        }
    }


    private extractNodeId(status: any): string | undefined {
        // Tendermint/CometBFT variants
        // Possible paths: result.node_info.id or node_info.id
        if (!status) return undefined;
        if (status.result?.node_info?.id) return String(status.result.node_info.id);
        if (status.node_info?.id) return String(status.node_info.id);
        return undefined;
    }
}
