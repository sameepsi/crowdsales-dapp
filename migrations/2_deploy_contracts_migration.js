var KVCToken = artifacts.require("./KVCToken.sol");
var RefundableCrowdsale = artifacts.require("./RefundableCrowdsale.sol");

module.exports = function(deployer) {
  deployer.deploy(KVCToken, 1000000000, "kvc", "KVC").then(function(){
    console.log(KVCToken.address);
    deployer.deploy(RefundableCrowdsale, 2, 100, 1000000000000000, "0xF97D9fc484024F3379D51F422F843b194E9D41C5", KVCToken.address);
  });
};
