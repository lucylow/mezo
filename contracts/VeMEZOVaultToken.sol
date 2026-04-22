// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VeMEZOVaultToken
 * @notice ERC-4626-style vault share token (vveMEZO) minted/burned by the AutoCompounder vault.
 *         Tracks total underlying MEZO so share price auto-compounds with each epoch.
 */
contract VeMEZOVaultToken is ERC20, ERC20Burnable, Ownable2Step, ReentrancyGuard {
    address public immutable vault;
    address public immutable asset;
    uint256 private _totalAssets;

    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);

    modifier onlyVault() {
        require(msg.sender == vault, "VeMEZOVaultToken: caller is not vault");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _vault,
        address _asset
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_vault != address(0), "Invalid vault address");
        require(_asset != address(0), "Invalid asset address");
        vault = _vault;
        asset = _asset;
    }

    function totalAssets() public view returns (uint256) {
        return _totalAssets;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : (assets * supply) / _totalAssets;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? shares : (shares * _totalAssets) / supply;
    }

    function maxWithdraw(address owner) public view returns (uint256) {
        return convertToAssets(balanceOf(owner));
    }

    function maxRedeem(address owner) public view returns (uint256) {
        return balanceOf(owner);
    }

    function previewDeposit(uint256 assets) public view returns (uint256) {
        return convertToShares(assets);
    }

    function previewRedeem(uint256 shares) public view returns (uint256) {
        return convertToAssets(shares);
    }

    function mintShares(address to, uint256 assets) external onlyVault nonReentrant returns (uint256 shares) {
        shares = convertToShares(assets);
        require(shares > 0, "VeMEZOVaultToken: zero shares");
        _mint(to, shares);
        _totalAssets += assets;
        emit Deposit(msg.sender, to, assets, shares);
        return shares;
    }

    function burnShares(address from, uint256 shares) external onlyVault nonReentrant returns (uint256 assets) {
        assets = convertToAssets(shares);
        require(assets > 0, "VeMEZOVaultToken: zero assets");
        require(assets <= _totalAssets, "VeMEZOVaultToken: insufficient assets");
        _burn(from, shares);
        _totalAssets -= assets;
        emit Withdraw(msg.sender, from, from, assets, shares);
        return assets;
    }

    function updateTotalAssets(uint256 newTotalAssets) external onlyVault {
        _totalAssets = newTotalAssets;
    }

    function emergencyUpdateTotalAssets(uint256 newTotalAssets) external onlyOwner {
        _totalAssets = newTotalAssets;
    }
}
