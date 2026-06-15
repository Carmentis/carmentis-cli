import * as v from 'valibot';

export const NodeSchema = v.object({
    hostname: v.string(),
    rpcEndpoint: v.string(),
    p2pEndpoint: v.string(),
    trusted: v.optional(v.boolean()),
    isSeed: v.optional(v.boolean()),
    nodeId: v.string(),
});

export const NetworkSchema = v.object({
    abciDockerImageLabel: v.string(),
    nodes: v.record(v.string(), NodeSchema),
});

export const NetworksFileSchema = v.record(
    v.string(),
    NetworkSchema,
);

export type NetworksFile = v.InferOutput<typeof NetworksFileSchema>;