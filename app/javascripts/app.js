//import jquery and bootstrap
import 'jquery';
import 'bootstrap-loader';
// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import crowdsales_artifacts from '../../build/contracts/RefundableCrowdsale.json'
import token_artifacts from '../../build/contracts/KVCToken.json'
import { inspect } from 'util';

// MetaCoin is our usable abstraction, which we'll use through the code below.
var CrowdSalesContract = contract(crowdsales_artifacts);
var KVTokenContract = contract(token_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var rate;
var saleOn = false;
var goalReached = false;
var refunding = false;
var finalized = false;

window.App = {
  start: function() {
   //bootstrap everything
   var self = this;
   
       // Bootstrap the MetaCoin abstraction for Use.
       CrowdSalesContract.setProvider(web3.currentProvider);
       KVTokenContract.setProvider(web3.currentProvider);
   
       // Get the initial account balance so it can be displayed.
       web3.eth.getAccounts(function(err, accs) {
         if (err != null) {
           alert("There was an error fetching your accounts.");
           return;
         }
   
         if (accs.length == 0) {
           alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
           return;
         }
   
         accounts = accs;
         console.log(accounts);
         account = accounts[0];
         console.log(account);
         App.initialize();
       });
  },

  printImportantInformation: function() {
    //print out some important information

    CrowdSalesContract.deployed().then(function(instance) {
      var anchor = document.getElementById("crowdsales_contract");
      anchor.setAttribute("href", "https://etherscan.io/address/"+instance.address );
      anchor.text=instance.address;
    }).catch(function(e){
          console.log(e);
    });
    App.getWeiRaised();
    App.getGoal();
    App.saleEnded();
    App.getGoalReached();
    App.getRateAndTime();
    App.setFinalized();

    KVTokenContract.deployed().then(function(instance) {
      var anchor = document.getElementById("token_contract");
      anchor.setAttribute("href", "https://etherscan.io/address/"+instance.address );
      anchor.text=instance.address;
      instance.getTokenDetail.call().then(function(response){
        $("#token_name").text(response[0]);
        $("#total_supply").text(response[2]);
      }).catch(function(e){
          console.log(e);
      });
    });

    web3.eth.getAccounts(function(err, accs) {
      web3.eth.getBalance(accs[0], function(err1, balance) {
        $("#my_address").text(accs[0]);
        $("#my_eth").text(web3.fromWei(balance, "ether"));
      });
    });

  },
   
  buyToken: function() {
//buy token
    CrowdSalesContract.deployed().then(function(instance){
      var price = document.getElementById("buy_eth_amount").value;

      web3.eth.sendTransaction({from:account,to:instance.address, value:web3.toWei(price, "ether")}, function(err, txHash){
        if(!err){
          return console.log(txHash);
        }
        console.log(err);
      });
    }).catch(function(e) {
      console.log(e);
  });
  },
  refundBalance : function() {
    CrowdSalesContract.deployed().then(function(instance){
      instance.claimRefund({from:account}).then(function(txHash){
        console.log(txHash);
      }).catch(function(err){
        console.log(err);
      });
    });
  },
  setFinalized : function(){
    CrowdSalesContract.deployed().then(function(instance){
      instance.isFinalized.call().then(function(result){
        finalized = result;
        $("#finalized").text(finalized);
        
      });
    });
  },
    getWeiRaised : function(){
      CrowdSalesContract.deployed().then(function(instance){
        instance.weiRaised.call().then(function(result){
          $("#amount_raised").text(web3.fromWei(result, "ether"))
          
        });
      });
    },
  getGoal : function(){
    CrowdSalesContract.deployed().then(function(instance){
      instance.goal.call().then(function(result){
        $("#funding_goal").text(web3.fromWei(result, "ether"))
      }).catch(function(e){
        console.log(e);
      });
    });
  },
  saleEnded : function(){
    CrowdSalesContract.deployed().then(function(instance){
      instance.hasEnded.call().then(function(result){
        saleOn = !result;
        if(!saleOn && !goalReached){
          refunding = true;
          $("#refunding").text(refunding);
        }
        if(saleOn){
          $("#buy_btn").prop("disabled", false);
        }
        if(refunding && finalized){
          $("#refund_button").prop("disabled", false);
        }
        $("#sale_on").text(saleOn);
      });
    }) ;
  },
  getGoalReached : function(){
    CrowdSalesContract.deployed().then(function(instance){
      instance.goalReached.call().then(function(result){
        goalReached = result;
        if(!saleOn && !goalReached){
          refunding = true;
          $("#refunding").text(refunding);
       }
        if(refunding && finalized){
          $("#refund_button").prop("disabled", false);
        }
                $("#goal_reached").text(result);
      });
    });
  },
  getRateAndTime : function(){
    CrowdSalesContract.deployed().then(function(instance){
           
      instance.rate.call().then(function(result){
        rate = result;
        $("#current_price").text(web3.fromWei(result, "ether"));
      });
      instance.endTime.call().then(function(result){
        $("#end_date").text(new Date(result*1000));
      });
    });
  },
  updateTokenBalance: function() {
    //update the token balance
    var tokenInstance;
    KVTokenContract.deployed().then(function(instance){
      tokenInstance = instance;
      return tokenInstance.balanceOf.call(account);
    }).then(function(value){
      $("#my_kvc").text(value);
    }).catch(function(e){
      console.log(e);
    });
  },
  setTokenValue: function() {
    var ethValue = $("#buy_eth_amount").val();
    var weiAmount = web3.toWei(ethValue, "ether");
    var numberOfTokens = weiAmount/rate;
    $("#buy_estimated_tokens").text(numberOfTokens);
  },
  watchEvents: function() {
    //watch for token events
    var tokenInstance;
    KVTokenContract.deployed().then(function(instance){
      tokenInstance = instance;
      tokenInstance.Transfer({},{fromBlock:'latest',toBlock:'pending'}).watch(function(error, result){
        App.updateTokenBalance();
        web3.eth.getBalance(account, function(err1, balance) {
          $("#my_eth").text(web3.fromWei(balance, "ether"));
        });

      });
    }).catch(function(e){
      console.log(e);
    });
    CrowdSalesContract.deployed().then(function(crowdSalesInstance){
      crowdSalesInstance.TokenPurchase({},{fromBlock:'latest',toBlock:'pending'}).watch(function(error, result){
        App.getWeiRaised();
       });
       crowdSalesInstance.Closed({},{fromBlock:'latest',toBlock:'pending'}).watch(function(error, result){
          saleOn=false;
          goalReached=true;
          refunding=false;
          $("#buy_btn").prop("disabled", true);
          $("#sale_on").text(saleOn);
          $("#goal_reached").text(goalReached);
          $("#refunding").text(refunding);
      });
      crowdSalesInstance.Finalized({},{fromBlock:'latest',toBlock:'pending'}).watch(function(error, result){
        
        finalized = true;
        $("#finalized").text(finalized);
    });
      
      crowdSalesInstance.RefundsEnabled({},{fromBlock:'latest',toBlock:'pending'}).watch(function(error, result){
        saleOn=false;
        goalReached=false;
        refunding=true;
        $("#buy_btn").prop("disabled", true);
        $("#sale_on").text(saleOn);
        $("#goal_reached").text(goalReached);
        $("#refunding").text(refunding);
        $("#refund_button").prop("disabled", false);
        
    });
    }).catch(function(err){
      console.log(err);
    });
  },
/**
   * TOKEN FUNCTIONS FROM HERE ON
   */
  initialize: function() {
    App.updateTokenBalance();
    App.watchEvents();
    App.printImportantInformation();
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.log("Using web3 detected from external source.")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
    
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
  web3.version.getNetwork((err, netId) => {
    switch (netId) {
      
      case "4":
        console.log('This is the rinkeby test network.')
        $("#account-alert").hide();
        App.start();
        
        break
      default:
        console.log('Please connect to rinkeby test net');
        $("#account-alert").show();
    }
  })
});
