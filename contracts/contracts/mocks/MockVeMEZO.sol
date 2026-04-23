// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockVeMEZO
 * @notice Minimal veMEZO mock for unit tests.
 *
 * Tracks a per-tokenId "balance" (voting power) and allows the test suite
 * to set arbitrary balances, lock data, and simulate claimRebase returns.
 */
contract MockVeMEZO is ERC721("Mock veMEZO", "mveMEZO") {
    uint256 private _nextId = 1;

    struct LockData {
        int128 amount;
        uint256 end;
    }

    mapping(uint256 => uint256) public balanceOfNFTMap;
    mapping(uint256 => LockData) public lockData;
    mapping(uint256 => uint256) public pendingRebase;

    address public token;

    constructor(address _token) {
        token = _token;
    }

    function mint(address to, uint256 value) external returns (uint256 id) {
        id = _nextId++;
        _safeMint(to, id);
        balanceOfNFTMap[id] = value;
        lockData[id] = LockData(int128(int256(value)), block.timestamp + 365 days);
    }

    function balanceOfNFT(uint256 tokenId) external view returns (uint256) {
        return balanceOfNFTMap[tokenId];
    }

    function locked(uint256 tokenId) external view returns (int128 amount, uint256 end) {
        LockData storage d = lockData[tokenId];
        return (d.amount, d.end);
    }

    function totalSupply() external view returns (uint256) {
        return _nextId - 1;
    }

    function claimRebase(uint256 tokenId) external returns (uint256 amount) {
        amount = pendingRebase[tokenId];
        pendingRebase[tokenId] = 0;
        balanceOfNFTMap[tokenId] += amount;
    }

    function increaseAmount(uint256 tokenId, uint256 amount) external {
        balanceOfNFTMap[tokenId] += amount;
        lockData[tokenId].amount += int128(int256(amount));
    }

    function increaseUnlockTime(uint256 tokenId, uint256 unlockTime) external {
        lockData[tokenId].end = unlockTime;
    }

    function createLock(uint256 amount, uint256 unlockTime) external returns (uint256 id) {
        id = _nextId++;
        _safeMint(msg.sender, id);
        balanceOfNFTMap[id] = amount;
        lockData[id] = LockData(int128(int256(amount)), unlockTime);
    }

    function withdraw(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _burn(tokenId);
        delete balanceOfNFTMap[tokenId];
        delete lockData[tokenId];
    }

    function setPendingRebase(uint256 tokenId, uint256 amount) external {
        pendingRebase[tokenId] = amount;
    }

    function setBalance(uint256 tokenId, uint256 amount) external {
        balanceOfNFTMap[tokenId] = amount;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
