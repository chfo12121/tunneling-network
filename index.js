let [proxyHost, proxyPort] = process.env.NODE_TUNNELING_NETWORK_PROXY.split(':')

require('./lib/nodeNetworkAPI')(proxyHost, +proxyPort)