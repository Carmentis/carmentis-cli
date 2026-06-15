import path from "node:path";
import {confirm, input, select} from "@inquirer/prompts";
import {CMTSToken} from "@cmts-dev/carmentis-sdk/server";
import {join} from "path";
import {EndpointTransformer} from "../../utils/EndpointTransformer";

export abstract class AbstractNodeConfigParamsResolver {

    constructor(
        protected readonly options: any
    ) {}


    protected async getCometbftEmptyMicroblockCreationInterval() {
        return '5s';
    }


    protected async askMinimumGasPriceAccepted() {
        const minGas = await input({
            message: 'You have the possibility to reject microblocks having lower than a specified gas price. Enter your minimum gas price accepted by the node (e.g., 0.1 CMTS, 100 CMTS):',
            default: "0.01 CMTS",
            validate: (value: string) => {
                CMTSToken.parse(value);
                return true;
            }
        })
        return CMTSToken.parse(minGas).getAmountAsAtomic();
    }

    protected async askNodeDomainName() {
        return input({
            message: 'Enter the domain name of your node (my-node.example.com):',
            required: true,
            validate: (value: string) => {
                const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
                return domainRegex.test(value) ? true : 'Invalid domain name format';
            }
        });
    }


    protected ensureHome() {
        const home = this.options.home
        if (typeof home !== "string") throw new Error(`${home} is not provided but is required`);
        return path.resolve(home);
    }


    protected getAbciHome(): string {
        return this.options.home;
    }

    protected askMoniker() {
        return (
            this.options.moniker ||
            input({
                message: 'Enter the name of your node',
                required: true,
                validate: (value: string) => typeof value === 'string' && value.length > 0 && value.trim().length > 0,
            })
        );
    }

    protected async askCors() {
        let cors = ["*"]
        let agreed = false;
        let shouldAskIfOk = true;
        do {
            if (shouldAskIfOk) {
                agreed = await confirm({
                    message: `Are you satisfied with the following cors configuration: ${JSON.stringify(cors) || '(none)'}?`,
                });
            }


            if (!agreed) {
                const formattedCors = await input({
                    message: "Enter entries for your CORS configuration (separated by commas):",
                    validate: (value: string) => typeof value === 'string' && value.length > 0 && value.trim().length > 0,
                });
                try {
                    const corsEntries = formattedCors.split(',').map(entry => entry.trim());
                    cors = corsEntries.filter(entry => entry.length > 0);
                    shouldAskIfOk =  true;
                } catch (e) {
                    console.error("Invalid CORS configuration format. Please enter valid domain entries separated by commas.");
                    shouldAskIfOk = false;
                }
            }
        } while (!agreed);

        return cors;
    }

    protected askExposedRpcEndpoint(nodeDomainName: string) {
        return (
            this.options.exposedRpcEndpoint ||
            input({
                message: 'Enter the endpoint where one can contact the RPC interface of your node (https://example.com or http://example.com:26657):',
                required: true,
                default: `https://${nodeDomainName}`,
                validate: (value: string) => {
                    const transformer = new EndpointTransformer(value);
                    return transformer.isHttpOrHttpsEndpoint();
                },
            })
        );
    }

    protected askExternalP2PAddr(nodeDomainName: string) {
        return (
            input({
                message: 'Enter the TCP endpoint where one can contact the P2P interface of your node (example: tcp://example.com:26656)',
                required: true,
                default: `tcp://${nodeDomainName}:26656`
            })
        );
    }

    protected askExposedP2pEndpoint() {
        return (
            this.options.exposedP2pEndpoint ||
            input({
                message: 'Enter the endpoint where one can contact the P2P interface of your node',
                required: true,
            })
        );
    }


    protected getCometbftHome() {
        return join(this.options.home, 'cometbft');
    }

}