'use strict';

/**
 * Test content-encoding for uncompressed
 */

const assert = require('chai').assert;

const http = require('http');
const httpProxy = require('http-proxy');
const modifyResponse = require('../');

const SERVER_PORT = 5004;
const TARGET_SERVER_PORT = 5005;
const isObject = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

describe('modifyResponse--uncompressed', function () {
  let proxy, server, targetServer;
  beforeEach(() => {
    // Create a proxy server
    proxy = httpProxy.createProxyServer({
      target: 'http://localhost:' + TARGET_SERVER_PORT,
    });

    // Create your server and then proxies the request
    server = http
      .createServer((req, res) => proxy.web(req, res))
      .listen(SERVER_PORT);

    // Create your target server
    targetServer = http
      .createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
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
      proxy.on('proxyRes', function (proxyRes, req, res) {
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

    it('uncompressed: modify response json successfully', done => {
      // Test server
      http.get('http://localhost:' + SERVER_PORT, res => {
        let body = '';
        res.on('data', chunk => (body += chunk)).on('end', () => {
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

    it('uncompressed: modify response json successfully', done => {
      // Test server
      http.get('http://localhost:' + SERVER_PORT, res => {
        let body = '';
        res.on('data', chunk => (body += chunk)).on('end', () => {
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
