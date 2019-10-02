'use strict';
/**
 * Test content-encoding for gzip
 */

const assert = require('chai').assert;

const zlib = require('zlib');
const http = require('http');
const httpProxy = require('http-proxy');
const modifyResponse = require('../');

const SERVER_PORT = 5000;
const TARGET_SERVER_PORT = 5001;
const isObject = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

describe('modifyResponse--gzip', function () {
  let proxy, server, targetServer;
  beforeEach(() => {
    // Create a proxy server
    proxy = httpProxy.createProxyServer({
      target: 'http://localhost:' + TARGET_SERVER_PORT,
    });

    // Create your server and then proxies the request
    server = http
      .createServer((req, res) => {
        proxy.web(req, res);
      })
      .listen(SERVER_PORT);

    // Create your target server
    targetServer = http
      .createServer((req, res) => {
        // Create gzipped content
        let gzip = zlib.Gzip();
        let _write = res.write;
        let _end = res.end;

        gzip.on('data', buf => _write.call(res, buf));
        gzip.on('end', () => _end.call(res));

        res.write = data => gzip.write(data);
        res.end = () => gzip.end();

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
        });

        res.write(
          JSON.stringify({
            name: 'node-http-proxy-json',
            age: 1,
            version: '1.0.0',
          })
        );
        res.end();
      })
      .listen(TARGET_SERVER_PORT);
  });

  afterEach(() => {
    proxy.close();
    server.close();
    targetServer.close();
  });

  describe('callback returns data', () => {
    beforeEach(() => {
      // Listen for the `proxyRes` event on `proxy`.
      proxy.on('proxyRes', (proxyRes, req, res) => {
        modifyResponse(res, proxyRes, body => {
          if (isObject(body)) {
            // modify some information
            body.age = 2;
            delete body.version;
          }
          return body;
        });
      });
    });

    it('gzip: modify response json successfully', done => {
      // Test server
      http.get('http://localhost:' + SERVER_PORT, res => {
        let body = '';
        let gunzip = zlib.Gunzip();
        res.pipe(gunzip);

        gunzip
          .on('data', chunk => {
            body += chunk;
          })
          .on('end', () => {
            assert.equal(
              JSON.stringify({ name: 'node-http-proxy-json', age: 2 }),
              body
            );

            done();
          });
      });
    });
  });

  describe('callback returns a promise', () => {
    beforeEach(() => {
      // Listen for the `proxyRes` event on `proxy`.
      proxy.on('proxyRes', (proxyRes, req, res) => {
        modifyResponse(res, proxyRes, body => {
          if (isObject(body)) {
            // modify some information
            body.age = 2;
            delete body.version;
          }
          return Promise.resolve(body);
        });
      });
    });

    it('gzip: modify response json successfully', done => {
      // Test server
      http.get('http://localhost:' + SERVER_PORT, res => {
        let body = '';
        let gunzip = zlib.Gunzip();
        res.pipe(gunzip);

        gunzip
          .on('data', chunk => {
            body += chunk;
          })
          .on('end', () => {
            assert.equal(
              JSON.stringify({ name: 'node-http-proxy-json', age: 2 }),
              body
            );

            done();
          });
      });
    });
  });
});
