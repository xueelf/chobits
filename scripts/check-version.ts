import { version } from '~/package.json';

const tag = import.meta.env.GITHUB_REF_NAME;

if (tag !== `v${version}`) {
  throw new Error(`Git tag "${tag}" does not match package version "v${version}"`);
}
