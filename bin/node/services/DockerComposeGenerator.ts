import {DockerCompose} from "../types/DockerCompose";
import {FileManager} from "../utils/FileManager";
import yaml from 'yaml';

export class DockerComposeGenerator {
    static async generate(destination: string, config: DockerCompose): Promise<void> {
        await FileManager.writeFile(yaml.stringify(config), destination);
    }
}