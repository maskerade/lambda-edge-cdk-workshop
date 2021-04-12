import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as lambda from '@aws-cdk/aws-lambda';
import fs = require('fs');

export class CdkLambdaEdgeWorkshop01Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket
    const s3Bucket01 = new s3.Bucket(this, 'monkey-cards-')

    // copy local content to S3 Bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./website-dist/s3bucket01')],
      destinationBucket: s3Bucket01,
    });

    // Add S3 Bucket as Cloudfront Origin
    const originS3Bucket01 = new origins.S3Origin(s3Bucket01);

    // Edge Lambda for use with cloudfront distribution
    const securityHeaders = new cloudfront.experimental.EdgeFunction(this, 'AddSecurityHeaders', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: new lambda.InlineCode(fs.readFileSync('src/edge-lambdas/lambda-at-edge-add-security-headers.js', { encoding: 'utf-8' })),
    });

    // Create Cloudfront Origin for S3 bucket
    const cloudfrontDistro = new cloudfront.Distribution(this, 'WorkshopDist', {
      defaultBehavior: {
        origin: originS3Bucket01,
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
            functionVersion: securityHeaders.currentVersion
          }
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html'
    });

  }
}
