'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function fetchAdapter(config) {
  return new Promise(function dispatchFetchRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    // var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);

    // request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // // Set the request timeout in MS
    // request.timeout = config.timeout;

    // // Listen for ready state
    // request.onreadystatechange = function handleLoad() {
    //   if (!request || request.readyState !== 4) {
    //     return;
    //   }

    //   // The request errored out and we didn't get a response, this will be
    //   // handled by onerror instead
    //   // With one exception: request that using file: protocol, most browsers
    //   // will return status as 0 even though it's a successful request
    //   if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
    //     return;
    //   }

    //   // Prepare the response
    //   var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
    //   var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
    //   var response = {
    //     data: responseData,
    //     status: request.status,
    //     statusText: request.statusText,
    //     headers: responseHeaders,
    //     config: config,
    //     request: request
    //   };

    //   settle(resolve, reject, response);

    //   // Clean up request
    //   request = null;
    // };

    // // Handle browser request cancellation (as opposed to a manual cancellation)
    // request.onabort = function handleAbort() {
    //   if (!request) {
    //     return;
    //   }

    //   reject(createError('Request aborted', config, 'ECONNABORTED', request));

    //   // Clean up request
    //   request = null;
    // };

    // // Handle low level network errors
    // request.onerror = function handleError() {
    //   // Real errors are hidden from us by the browser
    //   // onerror should only fire if it's a network error
    //   reject(createError('Network Error', config, null, request));

    //   // Clean up request
    //   request = null;
    // };

    // // Handle timeout
    // request.ontimeout = function handleTimeout() {
    //   var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
    //   if (config.timeoutErrorMessage) {
    //     timeoutErrorMessage = config.timeoutErrorMessage;
    //   }
    //   reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
    //     request));

    //   // Clean up request
    //   request = null;
    // };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies');

      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    utils.forEach(requestHeaders, function setRequestHeader(val, key) {
      if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
        // Remove Content-Type if data is undefined
        delete requestHeaders[key];
      }
    });

    // // Add withCredentials to request if needed
    // if (!utils.isUndefined(config.withCredentials)) {
    //   request.withCredentials = !!config.withCredentials;
    // }

    // // Add responseType to request if needed
    // if (config.responseType) {
    //   try {
    //     request.responseType = config.responseType;
    //   } catch (e) {
    //     // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
    //     // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
    //     if (config.responseType !== 'json') {
    //       throw e;
    //     }
    //   }
    // }

    // // Handle progress if needed
    // if (typeof config.onDownloadProgress === 'function') {
    //   request.addEventListener('progress', config.onDownloadProgress);
    // }

    // // Not all browsers support upload events
    // if (typeof config.onUploadProgress === 'function' && request.upload) {
    //   request.upload.addEventListener('progress', config.onUploadProgress);
    // }

    const controller = new AbortController();
    const signal = controller.signal;
    if (config.cancelToken) {
      // Handle cancellation
      
      config.cancelToken.promise.then(function onCanceled(cancel) {

        controller.abort();
        reject(cancel);
      });
    }

    if (requestData === undefined) {
      requestData = null;
    }

    // // Send the request
    // request.send(requestData);    
    const req = {
      method: config.method.toUpperCase(),
      body: requestData,
      headers: requestHeaders,
      credentials: !utils.isUndefined(config.withCredentials) ? !!config.withCredentials ? 'include' : 'omit' : 'omit',
    };

    fetch(buildURL(fullPath, config.params, config.paramsSerializer), req as RequestInit)
    .then((res: Response) => {
      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (response.status === 0 && !(response.responseURL && response.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseData = !config.responseType || config.responseType === 'text' ? response.responseText : response.response;
      var response = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: parseHeaders(response.headers),
        config: config,
        request: response.request,
        signal: signal
      };

      settle(resolve, reject, response);
    }, (reason) => {
      reject(reason);
    })
    .catch(() => {      
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, req));
    })
  });
};
