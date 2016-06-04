# node-http-proxy-json
  for [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) transform the response json from the proxied server.

## Usage

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
            body.age = 2;
            delete body.version;
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
    res.write(JSON.stringify({name: 'node-http-proxy-json', age: 1, version: '1.0.0'}));
    res.end();
}).listen(5001);
```