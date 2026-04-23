// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ReferralManager
 * @notice Referral codes and accounting; payouts use a pre-funded reward token balance on this contract.
 */
contract ReferralManager is Ownable2Step {
    using SafeERC20 for IERC20;

    address public immutable vault;
    IERC20 public immutable rewardToken;

    mapping(string => address) public referrerByCode;
    mapping(address => address) public referrerOf;
    mapping(address => string) public referralCodeOf;
    mapping(address => uint256) public totalReferralRewards;

    uint256 public referralRewardRate = 500;

    event ReferralRegistered(address indexed user, address indexed referrer, string code);
    event ReferralRewardClaimed(address indexed referrer, uint256 amount);
    event ReferralRewardRateUpdated(uint256 oldRate, uint256 newRate);

    modifier onlyVault() {
        require(msg.sender == vault, "ReferralManager: not vault");
        _;
    }

    constructor(address _vault, address _rewardToken, address initialOwner) Ownable(initialOwner) {
        require(_vault != address(0) && _rewardToken != address(0), "ReferralManager: zero addr");
        vault = _vault;
        rewardToken = IERC20(_rewardToken);
    }

    function registerWithReferral(string calldata code) external {
        require(referrerOf[msg.sender] == address(0), "ReferralManager: already registered");
        address referrer = referrerByCode[code];
        require(referrer != address(0), "ReferralManager: invalid code");
        require(referrer != msg.sender, "ReferralManager: self referral");

        referrerOf[msg.sender] = referrer;
        emit ReferralRegistered(msg.sender, referrer, code);
    }

    function setReferralCode(string calldata code) external {
        require(bytes(code).length >= 3 && bytes(code).length <= 16, "ReferralManager: code length");
        require(referrerByCode[code] == address(0), "ReferralManager: code taken");

        string memory oldCode = referralCodeOf[msg.sender];
        if (bytes(oldCode).length > 0) {
            delete referrerByCode[oldCode];
        }

        referrerByCode[code] = msg.sender;
        referralCodeOf[msg.sender] = code;
    }

    function recordReferralReward(address user, uint256 depositValue) external onlyVault returns (uint256 reward) {
        address referrer = referrerOf[user];
        if (referrer == address(0)) return 0;

        reward = (depositValue * referralRewardRate) / 10_000;
        totalReferralRewards[referrer] += reward;
    }

    function claimReferralRewards() external {
        uint256 amount = totalReferralRewards[msg.sender];
        require(amount > 0, "ReferralManager: nothing to claim");
        require(rewardToken.balanceOf(address(this)) >= amount, "ReferralManager: insufficient rewards pool");

        totalReferralRewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amount);

        emit ReferralRewardClaimed(msg.sender, amount);
    }

    /// @notice Protocol treasury seeds claimable referral payouts.
    function seedRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function setReferralRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "ReferralManager: rate cap");
        uint256 old = referralRewardRate;
        referralRewardRate = newRate;
        emit ReferralRewardRateUpdated(old, newRate);
    }
}
