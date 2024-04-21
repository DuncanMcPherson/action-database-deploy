// noinspection ExceptionCaughtLocallyJS

import {
  endGroup,
  getInput,
  setFailed,
  startGroup
} from "@actions/core";
import {
  context
} from "@actions/github";
import {existsSync} from "fs";
import { createGacFile } from "./createGACFile";
import { deployRules, ErrorResult } from "./deploy";

const projectId = getInput('projectId');
const googleCredentials = getInput("firebaseServiceAccount", {
  required: true
});
const firebaseToolsVersion = getInput('firebaseToolsVersion');
const entryPoint = getInput('entryPoint');

async function run() {
  const isPullRequest = !!context.payload.pull_request;
  if (isPullRequest) {
    throw Error("This action should only be used on the master branch after a pull request has been completed");
  }

  let finish = (details: Object) => console.log(details)

  try {
    startGroup("Verifying that firebase.json exists");
    if (entryPoint !== '.') {
      console.log(`Attempting to change directory to: ${entryPoint}`)
      try {
        process.chdir(entryPoint);
      } catch (err) {
        throw Error(`Error changing to directory: ${entryPoint}: ${err}`);
      }
    }

    if (existsSync('./firebase.json')) {
      console.log('firebase.json found. Continuing deploy')
    } else {
      throw Error("firebase.json not found. If your firebase.json file is not in the root of your directory, edit the entryPoint option of this action.");
    }
    endGroup();

    startGroup("Setting up credentials");
    const gacFileName = await createGacFile(googleCredentials);
    console.log("Created a temp file with Default Google Credentials");
    endGroup();

    startGroup("Deploying rules");
    const deployment = await deployRules(gacFileName, {
      projectId,
      firebaseToolsVersion
    });

    if (deployment.status === 'error') {
      throw Error((deployment as ErrorResult).error)
    }
    endGroup();

    finish({
      conclusion: 'Success'
    });
  } catch (err) {
    setFailed(err.message);
    finish({
      conclusion: 'Failure',
      output: {
        title: "Deploy of rules failed",
        summary: `Error: ${err.message}`
      }
    });
  }
}

// noinspection JSIgnoredPromiseFromCall
run();