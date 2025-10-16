import os from 'node:os';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { CometBFTEndpointAccumulator } from './cometBFTEndpointAccumulator';
import { EndpointTransformer } from './EndpointTransformer';
import { NodeInfoFetcher } from './NodeInfoFetcher';

export interface NetworksFile {
    [networkName: string]: {
        nodes: {
            [nodeHostname: string]: {
                hostname: string;
                rpcEndpoint: string;
                p2pEndpoint: string;
                trusted?: boolean;
                nodeId: string;
            };
        };
    };
}

export class NetworksStore {
    private readonly baseDir: string;
    private readonly filePath: string;

    constructor(customPath?: string) {
        const home = os.homedir();
        this.baseDir = customPath ? path.dirname(customPath) : path.join(home, '.cmts');
        this.filePath = customPath ?? path.join(this.baseDir, 'networks.json');
    }

    public getPath(): string {
        return this.filePath;
    }

    async read(): Promise<NetworksFile> {
        try {
            const raw = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return {};
            return parsed as NetworksFile;
        } catch (e: any) {
            if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) {
                return {};
            }
            throw e;
        }
    }

    async write(data: NetworksFile): Promise<void> {
        await fs.mkdir(this.baseDir, { recursive: true });
        const json = JSON.stringify(data, null, 2);
        await fs.writeFile(this.filePath, json, 'utf8');
    }

    async createNetwork(name: string): Promise<void> {
        const store = await this.read();
        if (store[name]) {
            throw new Error(`Network "${name}" already exists.`);
        }
        store[name] = { nodes: {} };
        await this.write(store);
    }

    async deleteNetwork(name: string): Promise<boolean> {
        const store = await this.read();
        if (!store[name]) return false;
        delete store[name];
        await this.write(store);
        return true;
    }

    async addNode(network: string, hostname: string, rpcEndpoint: string, p2pEndpoint: string, trusted: boolean = true): Promise<void> {
        const store = await this.read();
        const n = store[network];
        if (!n) throw new Error(`Network "${network}" does not exist.`);
        if (n.nodes[hostname])
            throw new Error(`Node "${hostname}" already exists in network "${network}".`);

        // we now search for the node identifier
        const fetcher = new NodeInfoFetcher(rpcEndpoint);
        try {
            const nodeId = await fetcher.extractNodeId();
            if (typeof nodeId === 'string') {
                n.nodes[hostname] = { hostname, rpcEndpoint, p2pEndpoint, trusted, nodeId };
            } else {
                throw new Error(`Unable to obtain the node identifier for ${hostname} (contacted ${rpcEndpoint})`)
            }
        } catch {
            throw new Error(`Handled error: Unable to obtain the node identifier for ${hostname} (contacted ${rpcEndpoint})`)
        }
        await this.write(store);
    }

    async setEndpoint(
        network: string,
        hostname: string,
        kind: 'rpc' | 'p2p',
        url: string,
    ): Promise<void> {
        const store = await this.read();
        const n = store[network];
        if (!n) throw new Error(`Network "${network}" does not exist.`);
        const node = n.nodes[hostname];
        if (!node) throw new Error(`Node "${hostname}" does not exist in network "${network}".`);
        if (kind === 'p2p') node.p2pEndpoint = url;
        // if the user attemps to update the RPC endpoint, then we update the node id
        if (kind === 'rpc') {
            const fetcher = new NodeInfoFetcher(url);
            const nodeId = await fetcher.extractNodeId();
            if (typeof nodeId === 'string') {
                node.rpcEndpoint = url;
                node.nodeId = nodeId;
            } else {
                throw new Error(`Cannot update RPC endpoint for ${hostname}: cannot recover the node identifier from ${url}`)
            }
        }
        await this.write(store);
    }

    async changeTrustOfNodes(network: string, hostnames: string[], shouldTrust: boolean): Promise<void> {
        const store = await this.read();
        const n = store[network];
        if (!n) throw new Error(`Network "${network}" does not exist.`);
        for (const host of hostnames) {
            if (!host) continue;
            const node = n.nodes[host];
            if (!node) throw new Error(`Node "${host}" does not exist in network "${network}".`);
            node.trusted = shouldTrust;
        }
        await this.write(store);
    }

    async removeNodes(network: string, hosts: string[]) {
        const store = await this.read();
        const n = store[network];
        if (!n) throw new Error(`Network "${network}" does not exist.`);
        for (const host of hosts) {
            if (!host) continue;
            delete n.nodes[host];
        }
        await this.write(store);
    }

    async getNetworkNames() {
        const store =  await this.read();
        return Object.keys(store)
    }
}
