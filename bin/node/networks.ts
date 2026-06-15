import {NetworksFile} from "./types/NetworksFile";

const networks: NetworksFile = {
    "devnet": {
        abciDockerImageLabel: 'devnet',
        "nodes": {
            "node1.server1.devnet.carmentis.io": {
                "hostname": "node1.server1.devnet.carmentis.io",
                "rpcEndpoint": "https://node1.server1.devnet.carmentis.io",
                "p2pEndpoint": "http://server1.devnet.carmentis.io:26656",
                "trusted": true,
                "nodeId": "82958a461e6b85405a83fd1958d21a69c2dceaed"
            },
            "node2.server2.devnet.carmentis.io": {
                "hostname": "node2.server2.devnet.carmentis.io",
                "rpcEndpoint": "https://node2.server2.devnet.carmentis.io",
                "p2pEndpoint": "node2.server2.devnet.carmentis.io:26656",
                "trusted": true,
                "nodeId": "8a322c84cea1d33e6f0efb674a2967dcf7955b4a"
            }
        }
    },
}

export function getDefaultNetworks() {
    return networks;
}
