exports.handler =  (event, context, callback) => {
  const request = event.Records[0].cf.request
  const headers = request.headers
  if(request.uri == '/') {
    if (typeof headers['accept-language'] !== 'undefined') {
      const supportedLanguages = headers['accept-language'][0].value
      console.log('Supported languages:', supportedLanguages)
      if(supportedLanguages.startsWith('en')){
        callback(null, redirect('/en/'))
      } else if(supportedLanguages.startsWith('fr')){
        callback(null, redirect('/fr/'))
      } else {
        callback(null, redirect('/en/'))
      }
    } else {
      callback(null, redirect('/en/'))
    }
  } else {
    callback(null, request)
  }
};

function redirect (to) {
  return {
    status: '301',
    statusDescription: 'redirect to browser language',
    headers: {
      location: [{ key: 'Location', value: to }]
    }
  }
}