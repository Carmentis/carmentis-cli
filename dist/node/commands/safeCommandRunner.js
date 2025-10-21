"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeCommandRunner = void 0;
class SafeCommandRunner {
    static async safeRun(runner) {
        const safeRunner = new SafeCommandRunner(runner);
        await safeRunner.run();
    }
    constructor(runner) {
        this.runner = runner;
    }
    get shouldRunInDebug() {
        return process.env.CMTS_DEBUG !== undefined;
    }
    async run() {
        try {
            await this.runner();
        }
        catch (error) {
            if (this.shouldRunInDebug)
                console.error(error);
            if (error instanceof Error) {
                console.error(error.message);
            }
            else {
                console.error(error);
            }
        }
    }
}
exports.SafeCommandRunner = SafeCommandRunner;
