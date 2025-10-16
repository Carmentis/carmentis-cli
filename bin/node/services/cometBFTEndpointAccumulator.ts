import { NodeInfoService } from './nodeInfo';

/**
 * This class is used to accumulate a set of RPC/P2P endpoints to be used later to construct
 * a config.
 */
export class CometBFTEndpointAccumulator {
    private rpcEndpoints: string[] = [];
    private p2pEndpoints: string[] = [];
    private nodeInfo = new NodeInfoService();


    async parseEndpoint(endpoint: string) {
        if (endpoint.startsWith("p2p:")) {
            this.p2pEndpoints.push(endpoint.replace("p2p:", ""));
        } else if (endpoint.startsWith("rpc:")) {
            this.rpcEndpoints.push(endpoint.replace("rpc:", ""));
        } else {
            const { rpcEndpoint: nextRpcEndpoint, p2pEndpoint } = await this.obtainRpcAndP2PEndpointFromRpcEndpint(endpoint);
            this.rpcEndpoints.push(nextRpcEndpoint);
            this.p2pEndpoints.push(p2pEndpoint);
        }
    }

    async addRpcEndpoint(endpoint: string) {
        this.rpcEndpoints.push(endpoint);
    }

    async addP2PEndpoint(endpoint: string) {
        this.p2pEndpoints.push(endpoint);
    }

    private async obtainRpcAndP2PEndpointFromRpcEndpint(rpcEndpoint: string) {
        const nodeId = await this.nodeInfo.getNodeIdFromRpcEndpoint(rpcEndpoint);
        // we attempt to transform the rpcEndpoint into a p2p endpoint
        let p2pEndpoint = rpcEndpoint
            .replace('26657', '26656')
            .replace("https://", "")
            .replace("http://", "");

        // if the p2p endpoint does not end with !26656 (the default p2p port), add it
        if (!p2pEndpoint.endsWith(":26656")) {
            p2pEndpoint = p2pEndpoint + ":26656";
        }

        return {
            rpcEndpoint,
            p2pEndpoint: `${nodeId}@${p2pEndpoint}`,
        }
    }

    getP2PEndpoints() {
        return this.p2pEndpoints
    }

    getRpcEndpoints() {
        return this.rpcEndpoints;
    }
}