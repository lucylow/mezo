// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IVeMEZO is IERC721 {
    function createLock(uint256 amount, uint256 unlockTime) external returns (uint256 tokenId);
    function increaseAmount(uint256 tokenId, uint256 amount) external;
    function increaseUnlockTime(uint256 tokenId, uint256 unlockTime) external;
    function withdraw(uint256 tokenId) external;
    function claimRebase(uint256 tokenId) external returns (uint256 amount);
    function balanceOfNFT(uint256 tokenId) external view returns (uint256);
    function locked(uint256 tokenId) external view returns (int128 amount, uint256 end);
    function totalSupply() external view returns (uint256);
    function token() external view returns (address);
}
