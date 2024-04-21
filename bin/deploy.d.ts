export type ErrorResult = {
    status: "error";
    error: string;
};
export type SuccessResult = {
    status: "success";
};
type DeployConfig = {
    projectId: string;
    version?: string;
    firebaseToolsVersion?: string;
};
export type ProductionDeployConfig = DeployConfig & {};
export declare function deployRules(gacFilename: string, deployConfig: ProductionDeployConfig): Promise<ErrorResult | SuccessResult>;
export {};
