import commander from 'commander';
import inquirer from 'inquirer';
import {confirm} from '@inquirer/prompts';
import {NetworksStore} from '../services/networksStore';
import {SafeCommandRunner} from './safeCommandRunner';
import {NodeInfoFetcher} from '../utils/NodeInfoFetcher';
import {FileManager} from '../utils/FileManager';
import path from 'node:path';
import {NetworksFile} from "../types/NetworksFile";

function isFlag(token?: string): boolean {
    return !!token && token.startsWith('-');
}

export class NetworksCommand {
    constructor(private readonly store = new NetworksStore()) {}

    register(program: commander.Command) {
        const networks = program
            .command('networks')
            .description('Manage Carmentis networks and their nodes.');

        networks
            .command('add-network <name>')
            .addOption(new commander.Option('-l, --abci-docker-image-label <label>', 'ABCI Docker image label').default('mainnet'))
            .description('Add a new network')
            .action(async (name, options) => {
                console.log(options)
                await SafeCommandRunner.safeRun(() => this.createNetwork(name, options.abciDockerImageLabel));
            });

        networks
            .command('delete-network <name>')
            .description('Delete a  network')
            .action(async (name) => {
                await SafeCommandRunner.safeRun(() => this.deleteNetwork(name));
            });


        networks
            .command('check')
            .description('Check consistency between stored nodes and external nodes.')
            .action(async () => {
                await SafeCommandRunner.safeRun(() => this.checkConsistency());
            });


        networks
            .command('add-node <network>')
            .requiredOption("--hostname <hostname>", "Node hostname (e.g., node1.example.com)")
            .requiredOption("--rpc <rpc>", "RPC endpoint with protocol (e.g., https://rpc.example.com or http://node.example.com:26657)")
            .requiredOption("--p2p <p2p>", "P2P endpoint without protocol (e.g., p2p.example.com:26656)")
            .option("-t|--trust", "Trust this node (recommended for official nodes)", false)
            .option("-s|--seed", "Mark this node as a seed node", false)
            .description(`Add a node in the network

Standard Carmentis node configuration:
  • HTTP port 26657 for RPC (e.g., http://node.example.com:26657)
  • Port 26656 for P2P (e.g., node.example.com:26656)
  • RPC can also be accessed via reverse proxy (e.g., https://ares.testnet.carmentis.io)
  • Using ports directly is generally considered safe

Trust option:
  • Currently not enforced but may be used in the future to restrict network joins to official nodes
  • It is recommended to mark official/trusted nodes with --trust

Seed option:
  • Mark this node as a seed node (will be used for initial peer discovery)
  • Seed nodes will not be used as reference nodes during configuration

Examples:
  cmts networks add-node testnet --hostname node1 --rpc http://node1.example.com:26657 --p2p node1.example.com:26656
  cmts networks add-node testnet --hostname ares --rpc https://ares.testnet.carmentis.io --p2p ares.testnet.carmentis.io:26656 --trust
  cmts networks add-node testnet --hostname seed1 --rpc http://seed1.example.com:26657 --p2p seed1.example.com:26656 --seed`)
            .action(async (network, options) => {
                await SafeCommandRunner.safeRun(() => this.addNode(network, options.hostname, options.rpc, options.p2p, options.trust, options.seed));
            });



        networks
            .command('delete-node <network> <hostname>')
            .description('Delete a node')
            .action(async (network, hostname) => {
                await SafeCommandRunner.safeRun(() => this.removeNodes(network, [hostname]));
            });;

        networks.command('trust-node <network> <hostname>')
            .description('Mark the provided node as trusted')
            .action(async (network, hostname) => {
                await SafeCommandRunner.safeRun(() => this.trustNodes(network, [hostname], true));
            })

        networks.command('untrust-node <network> <hostname>')
            .description('Mark the provided node as not trusted')
            .action(async (network, hostname) => {
                await SafeCommandRunner.safeRun(() => this.trustNodes(network, [hostname], false));
            })

        networks
            .command('list')
            .description('List all networks and their nodes.')
            .action(async (options) => {
                await SafeCommandRunner.safeRun(() => this.listNetworks());
            });

        networks
            .command('import')
            .description('Export the networks')
            .option('-s|--source', 'Source to download the networks', 'https://assets.carmentis.io/networks.json')
            .option('--from-file <filename>', 'Read networks from a local JSON file')
            .action(async (options) => {
                await SafeCommandRunner.safeRun(() => this.importNetworks(options.source, options.fromFile));
            });

        networks
            .command('export')
            .description('Export the networks')
            .option("-f|--filter <filter>", "Filter networks")
            .action(async (options) => {
                await SafeCommandRunner.safeRun(() => this.exportNetworks(options.filter));
            });

        networks
            .command('edit-node <network> <hostname>')
            .requiredOption('--kind <kind>', "Kind of endpoint to update")
            .requiredOption("--endpoint <endpoint>" , "New endpoint")
            .description('Update an endpoint for a node')
            .action(async (network, hostname, options) => {
                await SafeCommandRunner.safeRun(() => this.setEndpoint(network, hostname, options.kind, options.endpoint))
            });
    }

    private async importNetworks(source?: string, fromFile?: string) {
        // Read local file
        const localNetworks: NetworksFile = (await this.store.read()) || {};

        let remoteNetworks: NetworksFile;

        try {
            if (fromFile) {
                // Read from local file
                const filePath = path.resolve(fromFile);
                console.log(`Reading networks from file ${filePath}...`);
                const fileContent = await FileManager.readFile(filePath);
                remoteNetworks = JSON.parse(fileContent);
            } else {
                // Fetch from URL
                const networksEndpoint = source || "https://assets.carmentis.io/networks.json";
                console.log(`Fetching networks from ${networksEndpoint}...`);
                const response = await fetch(networksEndpoint);
                if (!response.ok) {
                    throw new Error(`Failed to fetch networks: ${response.statusText}`);
                }
                remoteNetworks = await response.json();
            }

            // Merge logic
            for (const [networkName, remoteNetwork] of Object.entries(remoteNetworks)) {
                const localNetwork = localNetworks[networkName];

                if (!localNetwork) {
                    // New network → add directly
                    localNetworks[networkName] = remoteNetwork;
                    console.log(`✅ Added new network: ${networkName}`);
                } else {
                    // Existing → ask before overwrite
                    const overwrite = await confirm(
                        {
                            message: `Network "${networkName}" already exists locally. Overwrite it? (y/N): `,
                            default: false,
                        }
                    );

                    if (overwrite) {
                        localNetworks[networkName] = remoteNetwork;
                        console.log(`🔁 Replaced existing network: ${networkName}`);
                    } else {
                        console.log(`⏭️  Kept local version of: ${networkName}`);
                    }
                }
            }

            // Save merged result
            await this.store.write(localNetworks);
            console.log("💾 Networks updated locally.");

        } catch (err) {
            console.error(`❌ Error importing networks: ${(err as Error).message}`);
        }
    }


    private async exportNetworks(filter?: string): Promise<void> {
        const storeData: NetworksFile = await this.store.read();
        const exportedNetworksName = Object.keys(storeData)
            .filter((name) => filter === undefined || name.includes(filter));
        const exportedData: any = {}
        for (const name of exportedNetworksName) {
            exportedData[name] = storeData[name];
        }
        console.log(JSON.stringify(exportedData));
    }

    private async listNetworks(): Promise<void> {
        const storeData: NetworksFile = await this.store.read();

        if (Object.keys(storeData).length === 0) {
            console.log('⚠️  No networks found.');
            return;
        }

        for (const networkName of Object.keys(storeData)) {
            const network = storeData[networkName].nodes;
            const nodeNames = Object.keys(network);
            const nodesNumber = nodeNames.length;

            console.log(`\n🌐 Network: ${networkName} (${nodesNumber} node${nodesNumber > 1 ? 's' : ''})`);
            console.log(`ABCI Docker image label: ${storeData[networkName].abciDockerImageLabel}`);
            console.log('--------------------------------------------------');

            for (const nodeName of nodeNames) {
                const node = network[nodeName];

                console.log(`🔹 ${nodeName}`);
                console.log(`    Host     : ${node.hostname}`);
                console.log(`    Trusted  : ${node.trusted ? '✅ yes' : '❌ no'}`);
                console.log(`    Seed     : ${node.isSeed ? '✅ yes' : '❌ no'}`);
                console.log(`    RPC      : ${node.rpcEndpoint}`);
                console.log(`    P2P      : ${node.p2pEndpoint}`);
                console.log(`    Node ID  : ${node.nodeId}\n`);
            }
        }
    }


    private async checkConsistency() {
        const networks = await this.store.read();
        for (const networkName of Object.keys(networks)) {
            const network = networks[networkName];
            const nodes = network.nodes;
            for (const hostname of Object.keys(nodes)) {
                const node = nodes[hostname];
                const rpcEndpoint = node.rpcEndpoint;
                const fetcher = new NodeInfoFetcher(rpcEndpoint);
                const onlineNodeId = await fetcher.extractNodeId();
                const storedNodeId = node.nodeId;
                if (typeof onlineNodeId === 'string') {
                    if ( onlineNodeId === storedNodeId ) {
                        console.log(`[${networkName}] ${hostname} OK`)
                    } else {
                        console.error(`[${networkName}] ${hostname}: Invalid node identifiers: expected ${storedNodeId}, got ${onlineNodeId}`)
                    }
                } else {
                    console.error(`[${networkName}] ${hostname}: Cannot fecth node identifier`)
                }
            }
        }
    }

    private async createNetwork(network: string, abciDockerImageLabel: string): Promise<void> {
        await this.store.createNetwork(network, abciDockerImageLabel);
        console.log(`Network "${network}" created.`);
    }

    private async deleteNetwork(network: string): Promise<void> {
        const { confirm } = await inquirer.prompt([
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
        if (deleted) console.log(`Network "${network}" deleted.`);
        else console.log(`Network "${network}" does not exist.`);
    }

    private async addNode(network: string, hostname: string, rpcEndpoint: string, p2pEndpoint: string, trusted: boolean, isSeed: boolean = false): Promise<void> {
        await this.store.addNode(network, hostname, rpcEndpoint, p2pEndpoint, trusted, isSeed);
        console.log(`Added ${hostname} node(s) to network "${network}"`);
    }


    private async removeNodes(network: string, hosts: string[]): Promise<void> {
        await this.store.removeNodes(network, hosts);
        console.log(`Removed ${hosts.length} node(s) from network "${network}": ${hosts.join(', ')}`);
    }

    private async setEndpoint(
        network: string,
        host: string,
        kind: 'rpc' | 'p2p',
        url: string,
    ): Promise<void> {
        await this.store.setEndpoint(network, host, kind, url);
        console.log(`Set ${kind} endpoint for ${host} in network "${network}" to ${url}`);
    }

    private async trustNodes(network: string, hosts: string[], shouldTrust: boolean): Promise<void> {
        await this.store.changeTrustOfNodes(network, hosts, shouldTrust);
        console.log(`Trusted node(s) in network "${network}": ${hosts.join(', ')}`);
    }

    private handleError(e: any): never {
        console.error(e?.message ?? String(e));
        process.exit(1);
    }
}
