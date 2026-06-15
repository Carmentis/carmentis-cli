import * as v from 'valibot';

export const PortSchema = v.union([
    v.string(),
    v.object({
        target: v.number(),
        published: v.optional(v.number()),
        protocol: v.optional(v.picklist(['tcp', 'udp'])),
    }),
]);

export const VolumeSchema = v.union([
    v.string(),
    v.object({
        type: v.picklist(['bind', 'volume', 'tmpfs']),
        source: v.optional(v.string()),
        target: v.string(),
        read_only: v.optional(v.boolean()),
    }),
]);

export const ServiceSchema = v.object({
    image: v.optional(v.string()),
    container_name: v.optional(v.string()),
    hostname: v.optional(v.string()),
    command: v.optional(
        v.union([
            v.string(),
            v.array(v.string()),
        ]),
    ),
    user: v.optional(v.string()),
    expose: v.optional(v.array(v.string())),
    environment: v.optional(
        v.record(v.string(), v.string()),
    ),
    ports: v.optional(
        v.array(PortSchema),
    ),
    volumes: v.optional(
        v.array(VolumeSchema),
    ),
    depends_on: v.optional(
        v.array(v.string()),
    ),
    restart: v.optional(
        v.picklist([
            'no',
            'always',
            'on-failure',
            'unless-stopped',
        ]),
    ),
    networks: v.optional(
        v.array(v.string()),
    ),
});

export const NetworkSchema = v.object({
    driver: v.optional(v.string()),
});

export const ComposeSchema = v.object({
    services: v.record(
        v.string(),
        ServiceSchema,
    ),
    networks: v.optional(
        v.record(
            v.string(),
            NetworkSchema,
        ),
    ),
    volumes: v.optional(
        v.record(
            v.string(),
            v.object({}),
        ),
    ),
});

export type DockerCompose = v.InferOutput<typeof ComposeSchema>;