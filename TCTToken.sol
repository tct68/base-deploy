// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.18;

contract TCTToken {
  string public name = "CONTRACT_NAME";
  string public symbol = "CONTRACT_TICKER";
  uint8 public decimals = 18;
  uint256 public totalSupply = TOTAL_SUPPLY;

  mapping (address => uint256) public balances;
  address public owner;

  constructor() {
    owner = msg.sender;
    balances[owner] = totalSupply;
  }

  function transfer(address recipient, uint256 amount) public {
    require(balances[msg.sender] >= amount, "Insufficient balance.");
    balances[msg.sender] -= amount;
    balances[recipient] += amount;
  }

  function getName() public view returns (string memory){
        return name;
    }

    function getTotalSupply() public view returns (uint256){
        return totalSupply;
    }
    
    function getBalanceOf(address _owner) public view returns (uint256){
        return balances[_owner];
    }
    
     function getBalance() public view returns (uint256){
        return balances[address(this)];
    }
    
    function setTransfer(address _to, uint256 _value) public {
        transfer(_to,_value);
    }
}