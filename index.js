var config = require("/etc/docker-dns/config.json");

// Make some values fall back to default values if they are not valid
config.fallback_timeout = config.fallback_timeout || 350;
config.domains = config.domains || {};
config.external_dns = config.external_dns || ["8.8.4.4"];

var opts = require('rc')('dnsproxy', {
  host: '0.0.0.0',
  logging: 'dnsproxy:query',
  domains: config.domains,
  fallback_timeout: config.fallback_timeout
})

if (!opts.port) opts.port = config.port || 53;
if (!opts.host) opts.host = '0.0.0.0';
if (!opts.nameservers) opts.nameservers = config.external_dns;
if (!opts.servers) opts.servers = {};
if (!opts.domains) opts.domains = {};
if (!opts.hosts) opts.hosts = {};

process.env.DEBUG_FD = process.env.DEBUG_FD || 1;
process.env.DEBUG = process.env.DEBUG || opts.logging;
var d = process.env.DEBUG.split(',');
d.push('dnsproxy:error');
process.env.DEBUG = d.join(',');

var dgram = require('dgram');
var packet = require('native-dns-packet');
var util = require('./util.js');

var logdebug = require('debug')('dnsproxy:debug');
var logquery = require('debug')('dnsproxy:query');
var logerror = require('debug')('dnsproxy:error');

logdebug('options: %j', opts);

var server = dgram.createSocket('udp4');

server.on('listening', () => {
  var address = server.address();
  console.log(`dns server listening ${address.address}:${address.port}`);
});

server.on('error', function (err) {
  logerror('Server Error: %s', err);
});

server.on('message', function (message, rinfo) {
  var nameserver = opts.nameservers[0];
  var returner = false;

  var query = packet.parse(message);
  var domain = query.question[0].name;
  var type = query.question[0].type;

  logdebug('query: %j', query);

  Object.keys(opts.hosts).forEach(function (h) {
    if (domain === h) {
      var answer = opts.hosts[h];
      if (typeof opts.hosts[opts.hosts[h]] !== 'undefined') {
        answer = opts.hosts[opts.hosts[h]];
      }

      logquery('type: host, domain: %s, answer: %s', domain, opts.hosts[h]);

      var res = util.createAnswer(query, answer);
      server.send(res, 0, res.length, rinfo.port, rinfo.address);

      returner = true;
    }
  });

  if (returner) {
    return;
  }

  Object.keys(opts.domains).forEach(function (s) {
    if (domain.match(s)) {
      var answer = opts.domains[s];
      if (typeof opts.domains[opts.domains[s]] !== 'undefined') {
        answer = opts.domains[opts.domains[s]];
      }

      logquery('type: server, domain: %s, answer: %s', domain, opts.domains[s]);

      var res = util.createAnswer(query, answer);
      server.send(res, 0, res.length, rinfo.port, rinfo.address);

      returner = true;
    }
  });

  if (returner) {
    return
  }

  Object.keys(opts.servers).forEach(function (s) {
    if (domain.indexOf(s) !== -1) {
      nameserver = opts.servers[s]
    }
  })

  var fallback
  (function queryns (message, nameserver) {
    var sock = dgram.createSocket('udp4')
    sock.send(message, 0, message.length, 53, nameserver, function () {
      fallback = setTimeout(function () {
        queryns(message, opts.nameservers[0])
      }, opts.fallback_timeout)
    })
    sock.on('error', function (err) {
      logerror('Socket Error: %s', err)
      process.exit(5)
    })
    sock.on('message', function (response) {
      clearTimeout(fallback)
      logquery('type: primary, nameserver: %s, query: %s, type: %s, answer: %s', nameserver, domain, util.records[type] || 'unknown', util.listAnswer(response))
      server.send(response, 0, response.length, rinfo.port, rinfo.address)
      sock.close()
    })
  }(message, nameserver))
})

server.bind(opts.port, opts.host)
