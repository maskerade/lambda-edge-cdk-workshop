#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkLambdaEdgeWorkshop01Stack } from '../lib/cdk-lambda-edge-workshop01-stack';

const app = new cdk.App();
new CdkLambdaEdgeWorkshop01Stack(app, 'CdkLambdaEdgeWorkshop01', {
  env: {
    region: 'eu-west-1'
  }
});
