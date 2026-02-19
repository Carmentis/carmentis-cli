import {OperatorConfigGenerationParams} from "./OperatorConfigGenerator";
import {input} from "@inquirer/prompts";
import {EndpointTransformer} from "../../utils/EndpointTransformer";
import {randomBytes} from "node:crypto";

export class OperatorConfigParamsResolver {
    /**
     * This method is used to convert the provided initial inputs (obtained by command line arguments) and to complete
     * the params.
     * @param options
     */
    static async resolveParams(options: any) {
        const config: OperatorConfigGenerationParams = {
            allowEncryptionKeyGeneration: true,
            downloadEndpoints:  {
                dockerCompose: 'https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/operator/docker-compose-with-caddy.yml',
                caddyfile: 'https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/operator/Caddyfile'
            },
            domainNames: {
                operator: await this.askOperatorDomainName(options.operatorDomainName),
            },
            generateAt: options.home,
            operatorHome: '/operator', // Docker-specific,
            shouldDownload: {
                dockerCompose: true,
                caddyfile: true
            }
        }
        return config;
    }

    private static async askOperatorDomainName(providedDomainName?: string) {
        return providedDomainName || input({
            message: 'Enter the domain name of the operator',
        })
    }
}