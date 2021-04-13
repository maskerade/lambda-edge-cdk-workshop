'use strict';

exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const origin = request.origin;
  console.log(request);
  console.log(headers);
  console.log(origin);
  console.log(headers.cookie)

  //Setup the two different origins
  const originA = "cdklambdaedgeworkshop01-monkeycards360c77d0-1bi1iwgkdwn2g.s3-eu-west-1.amazonaws.com";
  const originB = "cdklambdaedgeworkshop01-hipstercards715bc7f5-sq5spgdu2uv7.s3-eu-west-1.amazonaws.com";

  //Determine whether the user has visited before based on a cookie value
  //Grab the 'origin' cookie if it's been set before
  if (headers.cookie) {
    console.log('Cookies Found')
    for (let i = 0; i < headers.cookie.length; i++) {
      if (headers.cookie[i].value.indexOf('origin=A') >= 0) {
        console.log('Origin A cookie found');
        headers['host'] = [{key: 'host',          value: originA}];
        origin.s3.domainName = originA;
        break;
      } else if (headers.cookie[i].value.indexOf('origin=B') >= 0) {
        console.log('Origin B cookie found');
        headers['host'] = [{key: 'host',          value: originB}];
        origin.s3.domainName = originB;
        break;
      }
    }
  }

  callback(null, request);
};