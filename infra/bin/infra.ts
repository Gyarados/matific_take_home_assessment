#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();
new InfraStack(app, 'InfraStack', {

  env: { account: '505857544867', region: 'sa-east-1' }, //TODO parametrize

});