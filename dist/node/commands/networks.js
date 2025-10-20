"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworksCommand = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const prompts_1 = require("@inquirer/prompts");
const networksStore_1 = require("../services/networksStore");
const safeCommandRunner_1 = require("./safeCommandRunner");
const NodeInfoFetcher_1 = require("../utils/NodeInfoFetcher");
function isFlag(token) {
    return !!token && token.startsWith('-');
}
class NetworksCommand {
    constructor(store = new networksStore_1.NetworksStore()) {
        this.store = store;
    }
    register(program) {
        const networks = program
            .command('networks')
            .description('Manage Carmentis networks and their nodes.');
        networks
            .command('add-network <name>')
            .description('Add a new network')
            .action(async (name) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.createNetwork(name));
        });
        networks
            .command('delete-network <name>')
            .description('Delete a  network')
            .action(async (name) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.deleteNetwork(name));
        });
        networks
            .command('check')
            .description('Check consistency between stored nodes and external nodes.')
            .action(async () => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.checkConsistency());
        });
        networks
            .command('add-node <network>')
            .requiredOption("--hostname <hostname>")
            .requiredOption("--rpc <rpcEndpoint>")
            .requiredOption("--p2p <p2pEndpoint>")
            .option("-t|--trust", "Trust this node", false)
            .description('Add a node in the network')
            .action(async (network, options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.addNode(network, options.hostname, options.rpc, options.p2p, options.trust));
        });
        networks
            .command('delete-node <network> <hostname>')
            .description('Delete a node')
            .action(async (network, hostname) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.removeNodes(network, [hostname]));
        });
        ;
        networks.command('trust-node <network> <hostname>')
            .description('Mark the provided node as trusted')
            .action(async (network, hostname) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.trustNodes(network, [hostname], true));
        });
        networks.command('untrust-node <network> <hostname>')
            .description('Mark the provided node as not trusted')
            .action(async (network, hostname) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.trustNodes(network, [hostname], false));
        });
        networks
            .command('list')
            .description('List all networks and their nodes.')
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.listNetworks());
        });
        networks
            .command('import')
            .description('Export the networks')
            .option('-s|--source', 'Source to download the networks', 'https://assets.carmentis.io/networks.json')
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.importNetworks(options.source));
        });
        networks
            .command('export')
            .description('Export the networks')
            .option("-f|--filter", "Filter networks")
            .action(async (options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.exportNetworks(options.filter));
        });
        networks
            .command('edit-node <network> <hostname>')
            .requiredOption('--kind <kind>', "Kind of endpoint to update")
            .requiredOption("--endpoint <endpoint>", "New endpoint")
            .description('Update an endpoint for a node')
            .action(async (network, hostname, options) => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(() => this.setEndpoint(network, hostname, options.kind, options.endpoint));
        });
    }
    async importNetworks(source) {
        const networksEndpoint = source || "https://assets.carmentis.io/networks.json";
        console.log(`Fetching networks from ${networksEndpoint}...`);
        // Read local file
        const localNetworks = (await this.store.read()) || {};
        try {
            const response = await fetch(networksEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch networks: ${response.statusText}`);
            }
            const remoteNetworks = await response.json();
            // Merge logic
            for (const [networkName, remoteNetwork] of Object.entries(remoteNetworks)) {
                const localNetwork = localNetworks[networkName];
                if (!localNetwork) {
                    // New network → add directly
                    localNetworks[networkName] = remoteNetwork;
                    console.log(`✅ Added new network: ${networkName}`);
                }
                else {
                    // Existing → ask before overwrite
                    const overwrite = await (0, prompts_1.confirm)({
                        message: `Network "${networkName}" already exists locally. Overwrite it? (y/N): `,
                        default: false,
                    });
                    if (overwrite) {
                        localNetworks[networkName] = remoteNetwork;
                        console.log(`🔁 Replaced existing network: ${networkName}`);
                    }
                    else {
                        console.log(`⏭️  Kept local version of: ${networkName}`);
                    }
                }
            }
            // Save merged result
            await this.store.write(localNetworks);
            console.log("💾 Networks updated locally.");
        }
        catch (err) {
            console.error(`❌ Error importing networks: ${err.message}`);
        }
    }
    async exportNetworks(filter) {
        const storeData = await this.store.read();
        const exportedNetworksName = Object.keys(storeData)
            .filter((name) => filter === undefined || name.includes(filter));
        const exportedData = {};
        for (const name of exportedNetworksName) {
            exportedData[name] = storeData[name];
        }
        console.log(JSON.stringify(exportedData));
    }
    async listNetworks() {
        const storeData = await this.store.read();
        if (Object.keys(storeData).length === 0) {
            console.log('⚠️  No networks found.');
            return;
        }
        for (const networkName of Object.keys(storeData)) {
            const network = storeData[networkName].nodes;
            const nodeNames = Object.keys(network);
            const nodesNumber = nodeNames.length;
            console.log(`\n🌐 Network: ${networkName} (${nodesNumber} node${nodesNumber > 1 ? 's' : ''})`);
            console.log('--------------------------------------------------');
            for (const nodeName of nodeNames) {
                const node = network[nodeName];
                console.log(`🔹 ${nodeName}`);
                console.log(`    Host     : ${node.hostname}`);
                console.log(`    Trusted  : ${node.trusted ? '✅ yes' : '❌ no'}`);
                console.log(`    RPC      : ${node.rpcEndpoint}`);
                console.log(`    P2P      : ${node.p2pEndpoint}`);
                console.log(`    Node ID  : ${node.nodeId}\n`);
            }
        }
    }
    async checkConsistency() {
        const networks = await this.store.read();
        for (const networkName of Object.keys(networks)) {
            const network = networks[networkName];
            const nodes = network.nodes;
            for (const hostname of Object.keys(nodes)) {
                const node = nodes[hostname];
                const rpcEndpoint = node.rpcEndpoint;
                const fetcher = new NodeInfoFetcher_1.NodeInfoFetcher(rpcEndpoint);
                const onlineNodeId = await fetcher.extractNodeId();
                const storedNodeId = node.nodeId;
                if (typeof onlineNodeId === 'string') {
                    if (onlineNodeId === storedNodeId) {
                        console.log(`[${networkName}] ${hostname} OK`);
                    }
                    else {
                        console.error(`[${networkName}] ${hostname}: Invalid node identifiers: expected ${storedNodeId}, got ${onlineNodeId}`);
                    }
                }
                else {
                    console.error(`[${networkName}] ${hostname}: Cannot fecth node identifier`);
                }
            }
        }
    }
    async createNetwork(network) {
        await this.store.createNetwork(network);
        console.log(`Network "${network}" created.`);
    }
    async deleteNetwork(network) {
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Delete network "${network}"? This cannot be undone.`,
                default: false,
            },
        ]);
        if (!confirm) {
            console.log('Operation cancelled.');
            return;
        }
        const deleted = await this.store.deleteNetwork(network);
        if (deleted)
            console.log(`Network "${network}" deleted.`);
        else
            console.log(`Network "${network}" does not exist.`);
    }
    async addNode(network, hostname, rpcEndpoint, p2pEndpoint, trusted) {
        await this.store.addNode(network, hostname, rpcEndpoint, p2pEndpoint, trusted);
        console.log(`Added ${hostname} node(s) to network "${network}"`);
    }
    async removeNodes(network, hosts) {
        await this.store.removeNodes(network, hosts);
        console.log(`Removed ${hosts.length} node(s) from network "${network}": ${hosts.join(', ')}`);
    }
    async setEndpoint(network, host, kind, url) {
        await this.store.setEndpoint(network, host, kind, url);
        console.log(`Set ${kind} endpoint for ${host} in network "${network}" to ${url}`);
    }
    async trustNodes(network, hosts, shouldTrust) {
        await this.store.changeTrustOfNodes(network, hosts, shouldTrust);
        console.log(`Trusted node(s) in network "${network}": ${hosts.join(', ')}`);
    }
    handleError(e) {
        console.error(e?.message ?? String(e));
        process.exit(1);
    }
}
exports.NetworksCommand = NetworksCommand;
