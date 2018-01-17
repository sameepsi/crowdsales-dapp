module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas:6000000
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: "4", // Rinkeby network id
      gas:6000000,
      from:"0xca1c1ac32deb6264f09bec984d375329545f2218"
    }
  }
};
