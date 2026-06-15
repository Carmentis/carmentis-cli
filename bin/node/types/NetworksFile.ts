import * as v from 'valibot';

export const NetworkNodeSchema = v.object({
    hostname: v.string(),
    rpcEndpoint: v.string(),
    p2pEndpoint: v.string(),
    trusted: v.optional(v.boolean()),
    isSeed: v.optional(v.boolean()),
    nodeId: v.string(),
});

export type NetworkNode = v.InferOutput<typeof NetworkNodeSchema>;

export const NetworkSchema = v.object({
    abciDockerImageLabel: v.string(),
    nodes: v.record(v.string(), NetworkNodeSchema),
});

export const NetworksFileSchema = v.record(
    v.string(),
    NetworkSchema,
);

export type Network = v.InferOutput<typeof NetworkSchema>;
export type NetworksFile = v.InferOutput<typeof NetworksFileSchema>;