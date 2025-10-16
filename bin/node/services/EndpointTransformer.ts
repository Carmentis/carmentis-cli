/**
 * This class is used to get information from an endpoint and transform it into another form of endpoint (RPC, P2P)
 */
export class EndpointTransformer {
    public static DEFAULT_RPC_PORT = 26657
    public static DEFAULT_P2P_PORT: number = 26656;
    constructor(private readonly endpoint: string) {}

    /**
     * Returns True if the endpoint given in constructor is only a hostname.
     */
    isHostname(): boolean {
        const value = (this.endpoint || '').trim();
        if (!value) return false;
        // Reject if it has a scheme
        if (/^https?:\/\//i.test(value)) return false;
        // Reject if it contains a path or query
        if (/[\/\s]/.test(value)) return false;
        // Reject if it contains a colon (likely a port or IPv6 literal)
        if (value.includes(':')) return false;
        return true;
    }

    /**
     * Returns True if the endpoint is Http or Https endpoint
     */
    isHttpOrHttpsEndpoint(): boolean {
        const value = (this.endpoint || '').trim();
        return /^https?:\/\//i.test(value);
    }

    /**
     * Transform the provided endpoint into endpoint. 
     * The user can specify the protocol and the port number to use.
     * This method should only work if the provided endpoint in constructor is a hostname!
     */
    transformEndpointFromHostname(protocol: 'http' | 'https' = 'https', port: number | undefined = undefined): string {
        if (!this.isHostname()) {
            throw new Error('transformEndpointFromHostname can only be used when the provided endpoint is a bare hostname');
        }
        const host = this.endpoint.trim();
        const proto = protocol.toLowerCase();
        const portSuffix = typeof port === 'number' ? `:${port}` : '';
        return `${proto}://${host}${portSuffix}`;
    }
    
    transformIntoRpcEndpointFromHostname() {
        return this.transformEndpointFromHostname('http', EndpointTransformer.DEFAULT_RPC_PORT);
    }
    
    transformIntoP2pEndpointFromHostname() {
        return this.transformEndpointFromHostname('https', EndpointTransformer.DEFAULT_P2P_PORT);
    }

    extractHostname() {
        const url = new URL(this.endpoint);
        const hostname = url.hostname;
        return hostname
    }
}