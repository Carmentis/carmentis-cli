import * as v from "valibot";

// ── Base ────────────────────────────────────────────────────────────────────

const CometBFTBaseSchema = v.object({
    version: v.optional(v.string(), "0.38.19"),
    proxy_app: v.optional(v.string(), "tcp://node-abci:26658"),
    moniker: v.optional(v.string(), "node2"),
    db_backend: v.optional(
        v.picklist(["goleveldb", "cleveldb", "boltdb", "rocksdb", "badgerdb"]),
        "goleveldb"
    ),
    db_dir: v.optional(v.string(), "data"),
    log_level: v.optional(v.string(), "info"),
    log_format: v.optional(v.picklist(["plain", "json"]), "plain"),
    genesis_file: v.optional(v.string(), "config/genesis.json"),
    priv_validator_key_file: v.optional(v.string(), "config/priv_validator_key.json"),
    priv_validator_state_file: v.optional(v.string(), "data/priv_validator_state.json"),
    priv_validator_laddr: v.optional(v.string(), ""),
    node_key_file: v.optional(v.string(), "config/node_key.json"),
    abci: v.optional(v.picklist(["socket", "grpc"]), "socket"),
    filter_peers: v.optional(v.boolean(), false),
});

// ── RPC ─────────────────────────────────────────────────────────────────────

export const CometBFTRpcSchema = v.object({
    laddr: v.optional(v.string(), "tcp://0.0.0.0:26657"),
    cors_allowed_origins: v.optional(v.array(v.string()), ["*"]),
    cors_allowed_methods: v.optional(v.array(v.string()), ["HEAD", "GET", "POST"]),
    cors_allowed_headers: v.optional(
        v.array(v.string()),
        ["Origin", "Accept", "Content-Type", "X-Requested-With", "X-Server-Time"]
    ),
    grpc_laddr: v.optional(v.string(), ""),
    grpc_max_open_connections: v.optional(v.number(), 900),
    unsafe: v.optional(v.boolean(), false),
    max_open_connections: v.optional(v.number(), 900),
    max_subscription_clients: v.optional(v.number(), 100),
    max_subscriptions_per_client: v.optional(v.number(), 5),
    experimental_subscription_buffer_size: v.optional(v.number(), 200),
    experimental_websocket_write_buffer_size: v.optional(v.number(), 200),
    experimental_close_on_slow_client: v.optional(v.boolean(), false),
    timeout_broadcast_tx_commit: v.optional(v.string(), "10s"),
    max_request_batch_size: v.optional(v.number(), 10),
    max_body_bytes: v.optional(v.number(), 1000000),
    max_header_bytes: v.optional(v.number(), 1048576),
    tls_cert_file: v.optional(v.string(), ""),
    tls_key_file: v.optional(v.string(), ""),
    pprof_laddr: v.optional(v.string(), ""),
});
export type CometBFTRpc = v.InferOutput<typeof CometBFTRpcSchema>;
export type CometBFTRPCPartial = Partial<CometBFTRpc>;

// ── P2P ─────────────────────────────────────────────────────────────────────

export const CometBFTP2PSchema = v.object({
    laddr: v.optional(v.string(), "tcp://0.0.0.0:26656"),
    external_address: v.optional(v.string(), ""),
    seeds: v.optional(v.string(), ""),
    persistent_peers: v.optional(v.string(), ""),
    addr_book_file: v.optional(v.string(), "config/addrbook.json"),
    addr_book_strict: v.optional(v.boolean(), false),
    max_num_inbound_peers: v.optional(v.number(), 40),
    max_num_outbound_peers: v.optional(v.number(), 10),
    unconditional_peer_ids: v.optional(v.string(), ""),
    persistent_peers_max_dial_period: v.optional(v.string(), "0s"),
    flush_throttle_timeout: v.optional(v.string(), "100ms"),
    max_packet_msg_payload_size: v.optional(v.number(), 1024),
    send_rate: v.optional(v.number(), 5120000),
    recv_rate: v.optional(v.number(), 5120000),
    pex: v.optional(v.boolean(), true),
    seed_mode: v.optional(v.boolean(), false),
    private_peer_ids: v.optional(v.string(), ""),
    allow_duplicate_ip: v.optional(v.boolean(), false),
    handshake_timeout: v.optional(v.string(), "20s"),
    dial_timeout: v.optional(v.string(), "3s"),
});
export type CometBFTP2P = v.InferOutput<typeof CometBFTP2PSchema>;
export type CometBFTP2PPartial = Partial<CometBFTP2P>;

// ── Mempool ──────────────────────────────────────────────────────────────────

const CometBFTMempoolSchema = v.object({
    type: v.optional(v.picklist(["flood", "nop"]), "flood"),
    recheck: v.optional(v.boolean(), true),
    recheck_timeout: v.optional(v.string(), "1s"),
    broadcast: v.optional(v.boolean(), true),
    wal_dir: v.optional(v.string(), ""),
    size: v.optional(v.number(), 500),
    max_txs_bytes: v.optional(v.number(), 2000000),
    cache_size: v.optional(v.number(), 10000),
    "keep-invalid-txs-in-cache": v.optional(v.boolean(), false),
    max_tx_bytes: v.optional(v.number(), 1048576),
    max_batch_bytes: v.optional(v.number(), 0),
    experimental_max_gossip_connections_to_persistent_peers: v.optional(v.number(), 0),
    experimental_max_gossip_connections_to_non_persistent_peers: v.optional(v.number(), 0),
});
export type CometBFTMempool = v.InferOutput<typeof CometBFTMempoolSchema>;
export type CometBFTMempoolPartial = Partial<CometBFTMempool>;

// ── State Sync ───────────────────────────────────────────────────────────────

export const CometBFTStateSyncSchema = v.object({
    enable: v.optional(v.boolean(), false),
    rpc_servers: v.optional(v.string(), ""),
    trust_height: v.optional(v.number(), 0),
    trust_hash: v.optional(v.string(), ""),
    trust_period: v.optional(v.string(), "168h0m0s"),
    discovery_time: v.optional(v.string(), "15s"),
    temp_dir: v.optional(v.string(), ""),
    chunk_request_timeout: v.optional(v.string(), "10s"),
    chunk_fetchers: v.optional(v.string(), "4"),
    max_snapshot_chunks: v.optional(v.number(), 100000),
});
export type CometBFTStateSync = v.InferOutput<typeof CometBFTStateSyncSchema>;
export type CometBFTStateSyncPartial = Partial<CometBFTStateSync>;

// ── Block Sync ───────────────────────────────────────────────────────────────

const CometBFTBlockSyncSchema = v.object({
    version: v.optional(v.picklist(["v0"]), "v0"),
});

// ── Consensus ────────────────────────────────────────────────────────────────

export const CometBFTConsensusSchema =
    v.object({
        wal_file: v.optional(v.string(), "data/cs.wal/wal"),
        timeout_propose: v.optional(v.string(), "3s"),
        timeout_propose_delta: v.optional(v.string(), "500ms"),
        timeout_prevote: v.optional(v.string(), "1s"),
        timeout_prevote_delta: v.optional(v.string(), "500ms"),
        timeout_precommit: v.optional(v.string(), "1s"),
        timeout_precommit_delta: v.optional(v.string(), "500ms"),
        timeout_commit: v.optional(v.string(), "1s"),
        double_sign_check_height: v.optional(v.number(), 0),
        skip_timeout_commit: v.optional(v.boolean(), true),
        create_empty_blocks: v.optional(v.boolean(), true),
        create_empty_blocks_interval: v.optional(v.string(), "30s"),
        peer_gossip_sleep_duration: v.optional(v.string(), "100ms"),
        peer_query_maj23_sleep_duration: v.optional(v.string(), "2s"),
    })
;
export type CometBFTConsensus = v.InferOutput<typeof CometBFTConsensusSchema>;
export type CometBFTConsensusPartial = Partial<CometBFTConsensus>;


// ── Storage ──────────────────────────────────────────────────────────────────

const CometBFTStorageSchema = v.object({
    discard_abci_responses: v.optional(v.boolean(), false),
});

// ── TX Index ─────────────────────────────────────────────────────────────────

const CometBFTTxIndexSchema = v.object({
    indexer: v.optional(v.picklist(["null", "kv", "psql"]), "kv"),
    "psql-conn": v.optional(v.string(), ""),
});

// ── Instrumentation ──────────────────────────────────────────────────────────

const CometBFTInstrumentationSchema = v.object({
    prometheus: v.optional(v.boolean(), true),
    prometheus_listen_addr: v.optional(v.string(), ":26660"),
    max_open_connections: v.optional(v.number(), 3),
    namespace: v.optional(v.string(), "cometbft"),
});

// ── Root ─────────────────────────────────────────────────────────────────────

export const CometBFTConfigSchema = v.object({
    ...CometBFTBaseSchema.entries,
    rpc: v.optional(CometBFTRpcSchema, {}),
    p2p: v.optional(CometBFTP2PSchema, {}),
    mempool: v.optional(CometBFTMempoolSchema, {}),
    statesync: v.optional(CometBFTStateSyncSchema, {}),
    blocksync: v.optional(CometBFTBlockSyncSchema, {}),
    consensus: v.optional(CometBFTConsensusSchema, {}),
    storage: v.optional(CometBFTStorageSchema, {}),
    tx_index: v.optional(CometBFTTxIndexSchema, {}),
    instrumentation: v.optional(CometBFTInstrumentationSchema, {}),
});
export type CometBFTConfig = v.InferOutput<typeof CometBFTConfigSchema>;
export type CometBFTConfigPartial = Partial<CometBFTConfig>;