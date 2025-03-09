#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { EcrStack, InfraStack, PREFIX  } from '../lib/infra-stack';

const account = "505857544867"; //TODO parametrize for different environments
const region = "sa-east-1";
const ecrStackName = PREFIX + 'ecr-stack';
const mainStackName = PREFIX + 'stack';

const app = new cdk.App();

const ecrStack = new EcrStack(app, ecrStackName, {

  env: { account: account, region: region }, 

});

const stack = new InfraStack(app, mainStackName, ecrStack.repository, {

  env: { account: account, region: region }, 

});
