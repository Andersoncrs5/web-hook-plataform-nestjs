export const BOOTSTRAP_TASK = Symbol("BOOTSTRAP_TASK");

export interface BootstrapTask {
    execute(): Promise<void>;
}