import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
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


    // Add second s3 bucket & origin for 'B' variant - sepia all the things!
    // S3 Bucket
    const s3Bucket02 = new s3.Bucket(this, 'hipster-cards-')

    // copy local content to S3 Bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite02', {
      sources: [s3deploy.Source.asset('./website-dist/s3bucket02')],
      destinationBucket: s3Bucket02,
    });

    // Grant ANYONE read permission to bucket
    // NOTE: Do not use in Production - this should restrict to Cloudfront OAI
    s3Bucket02.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [s3Bucket02.arnForObjects('*')],
      principals: [new iam.AnyPrincipal()],
    }));


    // Edge Lambda for use with cloudfront distribution - add security headers
    const securityHeaders = new cloudfront.experimental.EdgeFunction(this, 'AddSecurityHeaders', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: new lambda.InlineCode(fs.readFileSync('src/edge-lambdas/lambda-at-edge-add-security-headers.js', { encoding: 'utf-8' })),
    });

    // Edge Lambda for use with cloudfront distribution - add security headers
    const dynamicOrigin = new cloudfront.experimental.EdgeFunction(this, 'DynamicOrigin', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: new lambda.InlineCode(fs.readFileSync('src/edge-lambdas/lambda-at-edge-dynamic-origin.js', { encoding: 'utf-8' })),
    });

    // Edge Lambda for use with cloudfront distribution - add security headers
    const acceptedLanguage = new cloudfront.experimental.EdgeFunction(this, 'AcceptedLanguage', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: new lambda.InlineCode(fs.readFileSync('src/edge-lambdas/lambda-at-edge-accepted-language.js', { encoding: 'utf-8' })),
    });

    // Create Cloudfront Origin for S3 bucket
    const cloudfrontDistro = new cloudfront.Distribution(this, 'WorkshopDist', {
      defaultBehavior: {
        origin: originS3Bucket01,
        cachePolicy: new cloudfront.CachePolicy(this, 'IndexCachePolicy', {
          defaultTtl: cdk.Duration.seconds(5),
          minTtl: cdk.Duration.seconds(0),
          maxTtl: cdk.Duration.seconds(5),
          enableAcceptEncodingBrotli: true,
          enableAcceptEncodingGzip: true,
          cookieBehavior: cloudfront.CacheCookieBehavior.allowList('origin')
        }),
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            functionVersion: acceptedLanguage.currentVersion
          },
          {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
            functionVersion: securityHeaders.currentVersion
          },
          {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            functionVersion: dynamicOrigin.currentVersion
          }
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html'
    });

  }
}
