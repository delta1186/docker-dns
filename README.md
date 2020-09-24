# docker-dns

##### Run a dns proxy in docker with wildcard host support for Laravel Valet on Windows

This is intended purpose is to support Laravel Valet for Windows and Docker.  [Laravel](https://laravel.com/) is a PHP framework created by Taylor Otwell.
The tld `.test` will resolve to your parked Laravel Valet sites.  If you are using a differnt tld, then you just need to update the containers configuration file.



#### Quickstart:

##### Use built-in configuration
`docker run -p 53:53/udp -d --restart always hickskp/docker-dns`

##### Use user configuration
`docker run -v /c/local-path/to/config/:/etc/docker-dns/ -p 53:53/udp -d --restart always hickskp/docker-dns`

Optionally, give your container a name making it easier to manage by adding `--name docker-dns` or whatever name you like to the above commands.
Once this container is running, configure your system to route DNS queries through localhost and you're all set.

#### Configuration:

`docker-dns` can be configured through the use of a file called config.json:

```
{
  "port": 53,
  "external_dns": [
    "8.8.4.4",
    "8.8.8.8"
  ],
  "fallback_timeout": 350,
  "domains": {
    ".test$": "127.0.0.1"
  }
}
```

#### \#winning

#### Acknowlegements

Docker-DNS forked from [christhomas/docker-dns](https://github.com/christhomas/docker-dns) who actually forked [finboxio/docker-dns](https://github.com/finboxio/docker-dns).

DNS proxy code shamelessly copied from [hubdotcom/marlon-tools](https://github.com/hubdotcom/marlon-tools).

I certainly could not have come up with this solution on my own. Thanks for all those who have contributed above!
