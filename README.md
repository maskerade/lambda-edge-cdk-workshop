# Cloudfront & Lamda@Edge Workshops - Workshop 01

Workshop to create a cloudfront distribution with an S3 bucket as the origin.

Uses the library `@aws-cdk/aws-s3-deployment` to deploy local contents to the S3 bucket

```ts
    // copy local content to S3 Bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./website-dist/s3bucket01')],
      destinationBucket: s3Bucket01,
    });
```


Adds a Lambda@Edge function as a default behaviour on Origin Response to set security headers

Lamda@Edge Function definition:
```ts
    // Edge Lambda for use with cloudfront distribution
    const securityHeaders = new cloudfront.experimental.EdgeFunction(this, 'SecurityHeaders', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: new lambda.InlineCode(fs.readFileSync('src/edge-lambdas/lambda-at-edge-add-security-headers.js', { encoding: 'utf-8' })),
    });

```

Added to a cloudfront distribution as a default behaviour:
```ts
    const cloudfrontDistro = new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: {
        origin: originS3Bucket01,
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
            functionVersion: securityHeaders.currentVersion
          }
        ]
    });
```


`lib/` - contains the CDK code to generate the Cloudformation Template

`src/` - contains application code (lambda function code)

`website-dist` - contains all the web content used by the project

The main region can be set in `bin/cdk-lambda-edge-workshop01.ts`, in this case `eu-west-1`

```ts
new CdkLambdaEdgeWorkshop01Stack(app, 'CdkLambdaEdgeWorkshop01', {
  env: {
    region: 'eu-west-1'
  }
});
```

Note: All the CDK resources will be contained in this region/stack, with the exception of Lambda@Edge functions, these will be 
created in a separate stack in `us-east-1`  


## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
