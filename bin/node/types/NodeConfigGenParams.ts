import * as v from 'valibot';
import {NetworkNodeSchema} from "./NetworksFile";
// Parameters used to generate the Abci config
export const AbciConfigGenParamsSchema = v.object({
    home: v.string(),
    exposedRpcEndpoint: v.string(),
    exposedRpcDomainName: v.string(),
    genesis: v.optional(v.object({
        sk: v.string(),
    })),
    genesis_snapshot_origin: v.optional(NetworkNodeSchema),
    abciConfigFilename: v.string(),
    min_microblock_gas_price_in_atomics: v.number(),
})
export type AbciConfigGenParams = v.InferOutput<typeof AbciConfigGenParamsSchema>;
