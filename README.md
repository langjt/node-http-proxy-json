# http-proxy-response-rewrite [![Build Status](https://travis-ci.org/saskodh/http-proxy-response-rewrite.svg?branch=master)](https://travis-ci.org/saskodh/http-proxy-response-rewrite)
Rewrite the response body from [http-proxy](https://github.com/nodejitsu/node-http-proxy).

## Installation

```  
npm install http-proxy-response-rewrite
```

## Motivation
  When using [http-proxy](https://github.com/nodejitsu/node-http-proxy) sometimes you will need to modify the response body. While the response object is available and can be easily modified, the response body will usually be compressed. This library will take care of the necessary (de)compressing and leave to you only the modification concerns.
  So before using this repository, confirm your server compression format, currently only supports **gzip**、**deflate** and **uncompressed**.
  If you need other compression formats, please create a new Issue, and I will try to achieve it as much as possible.

## Use Cases

#### Simulation server using gzip compression

```
var zlib = require('zlib');
var http = require('http');
var httpProxy = require('http-proxy');
var modifyResponse = require('../');

// Create a proxy server
var proxy = httpProxy.createProxyServer({
    target: 'http://localhost:5001'
});

// Listen for the `proxyRes` event on `proxy`.
proxy.on('proxyRes', function (proxyRes, req, res) {
    modifyResponse(res, proxyRes.headers['content-encoding'], function (body) {
        if (body) {
            // modify some information
            var modifiedBody = JSON.parse(body);
            modifiedBody.age = 2;
            delete modifiedBody.version;
            return JSON.stringify(modifiedBody);
        }
        return body;
    });
});

// Create your server and then proxies the request
var server = http.createServer(function (req, res) {
    proxy.web(req, res);
}).listen(5000);

// Create your target server
var targetServer = http.createServer(function (req, res) {

    // Create gzipped content
    var gzip = zlib.Gzip();
    var _write = res.write;
    var _end = res.end;

    gzip.on('data', function (buf) {
        _write.call(res, buf);
    });
    gzip.on('end', function () {
        _end.call(res);
    });

    res.write = function (data) {
        gzip.write(data);
    };
    res.end = function () {
        gzip.end();
    };

    res.writeHead(200, {'Content-Type': 'application/json', 'Content-Encoding': 'gzip'});
    res.write(JSON.stringify({name: 'http-proxy-json', age: 1, version: '1.0.0'}));
    res.end();
}).listen(5001);
```

#### Simulation server using deflate compression

```
var zlib = require('zlib');
var http = require('http');
var httpProxy = require('http-proxy');
var modifyResponse = require('../');

// Create a proxy server
var proxy = httpProxy.createProxyServer({
    target: 'http://localhost:5001'
});

// Listen for the `proxyRes` event on `proxy`.
proxy.on('proxyRes', function (proxyRes, req, res) {
    modifyResponse(res, proxyRes.headers['content-encoding'], function (body) {
        if (body) {
            // modify some information
            var modifiedBody = JSON.parse(body);
            modifiedBody.age = 2;
            delete modifiedBody.version;
            return JSON.stringify(modifiedBody);
        }
        return body;
    });
});

// Create your server and then proxies the request
var server = http.createServer(function (req, res) {
    proxy.web(req, res);
}).listen(5000);

// Create your target server
var targetServer = http.createServer(function (req, res) {

    // Create deflated content
    var deflate = zlib.Deflate();
    var _write = res.write;
    var _end = res.end;

    deflate.on('data', function (buf) {
        _write.call(res, buf);
    });
    deflate.on('end', function () {
        _end.call(res);
    });

    res.write = function (data) {
        deflate.write(data);
    };
    res.end = function () {
        deflate.end();
    };

    res.writeHead(200, {'Content-Type': 'application/json', 'Content-Encoding': 'deflate'});
    res.write(JSON.stringify({name: 'http-proxy-json', age: 1, version: '1.0.0'}));
    res.end();
}).listen(5001);
```

#### Server does not enable compression

```
var http = require('http');
var httpProxy = require('http-proxy');
var modifyResponse = require('../');

// Create a proxy server
var proxy = httpProxy.createProxyServer({
    target: 'http://localhost:5001'
});

// Listen for the `proxyRes` event on `proxy`.
proxy.on('proxyRes', function (proxyRes, req, res) {
    modifyResponse(res, proxyRes.headers['content-encoding'], function (body) {
        if (body) {
            // modify some information
            var modifiedBody = JSON.parse(body);
            modifiedBody.age = 2;
            delete modifiedBody.version;
            return JSON.stringify(modifiedBody);
        }
        return body;
    });
});

// Create your server and then proxies the request
var server = http.createServer(function (req, res) {
    proxy.web(req, res);
}).listen(5000);

// Create your target server
var targetServer = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Content-Encoding': 'deflate'});
    res.write(JSON.stringify({name: 'http-proxy-json', age: 1, version: '1.0.0'}));
    res.end();
}).listen(5001);
```

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## License

  [MIT](http://opensource.org/licenses/MIT)