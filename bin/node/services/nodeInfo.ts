import { NetworksStore } from './networksStore';
import {Network, NetworkNode, NetworksFile} from "../types/NetworksFile";


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

    async listNodesInNetwork(networName: string, network: Network): Promise<NetworkNode[]> {
       return Object.values(network.nodes);
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
