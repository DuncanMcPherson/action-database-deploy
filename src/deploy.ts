import { exec } from "@actions/exec";

export type ErrorResult = {
  status: "error",
  error: string
}

export type SuccessResult = {
  status: "success",
}

type DeployConfig = {
  projectId: string;
  version?: string;
  firebaseToolsVersion?: string
}

export type ProductionDeployConfig = DeployConfig & {};

async function execWithCredentials(
  args: string[],
  projectId: string,
  gacFilename: string,
  opts?: {debug?: boolean, firebaseToolsVersion?: string}
) {
  let deployOutputBuf: Buffer[] = [];
  const debug = opts?.debug || false
  const toolsVersion = opts?.firebaseToolsVersion || 'latest';
  try {
    await exec(`npx gcloud auth application-default login`, [], {
      listeners: {
        stdout(data: Buffer) {
          deployOutputBuf.push(data);
        }
      }
    })
    await exec(
      `npx firebase-tools@${toolsVersion}`,
      [
        ...args,
        ...(projectId ? ["--project", projectId] : []),
        debug
          ? "--debug"
          : "--json"
      ],
      {
        listeners: {
          stdout(data: Buffer) {
            deployOutputBuf.push(data);
          }
        },
        env: {
          ...process.env,
          // FIREBASE_DEPLOY_AGENT: 'action-database-deploy',
          GOOGLE_APPLICATION_CREDENTIAL: gacFilename
        }
      }
    )
  } catch (err) {
    console.log(Buffer.concat(deployOutputBuf).toString());
    console.log(err.message);

    if (!debug) {
      console.log('Retrying with debug to get better error output');
      await execWithCredentials(
        args, projectId, gacFilename, {debug: true, firebaseToolsVersion: toolsVersion}
      );
    } else {
      throw err;
    }
  }

  return deployOutputBuf.length ?
    deployOutputBuf[deployOutputBuf.length - 1].toString()
    : '';
}

export async function deployRules(
  gacFilename: string,
  deployConfig: ProductionDeployConfig
) {
  const { projectId, version, firebaseToolsVersion } = deployConfig;
  const deploymentText = await execWithCredentials(
    ["deploy", "--only", "database"],
    projectId,
    gacFilename,
    { firebaseToolsVersion }
  );
  return JSON.parse(deploymentText) as
    | SuccessResult
    | ErrorResult;
}
