import { fileSync } from "tmp";
import {writeSync} from 'fs';

export async function createGacFile(googleApplicationCredential: string) {
  const tmpFile = fileSync({postfix: '.json'});

  writeSync(tmpFile.fd, googleApplicationCredential);

  return tmpFile.name;
}