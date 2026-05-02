// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title  IVeMEZO
 * @notice Interface for the Mezo veMEZO NFT contract.
 *
 *         veMEZO is an ERC-721 where each token represents a time-locked MEZO
 *         position. Key properties:
 *         • Lock period: 1 week minimum, 208 weeks (≈ 4 years) maximum.
 *         • Voting power decays linearly to zero as the lock approaches expiry.
 *         • NFTs are soulbound — they cannot be transferred between users directly.
 *           The vault acts as custodian by receiving NFTs via safeTransferFrom.
 *
 * @dev    Based on the Solidly ve-tokenomics architecture used by Mezo Earn.
 */
interface IVeMEZO is IERC721 {
    /**
     * @notice Create a new time-locked MEZO position and mint a veMEZO NFT.
     * @param  amount      Amount of MEZO to lock (18-decimal units).
     * @param  unlockTime  Unix timestamp when the lock expires (future epoch boundary).
     * @return tokenId     ID of the newly minted veMEZO NFT.
     */
    function createLock(uint256 amount, uint256 unlockTime) external returns (uint256 tokenId);

    /**
     * @notice Add more MEZO to an existing locked position without changing the unlock time.
     * @param  tokenId  ID of the veMEZO NFT to top up.
     * @param  amount   Additional MEZO to lock (18-decimal units).
     */
    function increaseAmount(uint256 tokenId, uint256 amount) external;

    /**
     * @notice Extend the unlock time of an existing locked position.
     * @param  tokenId     ID of the veMEZO NFT.
     * @param  unlockTime  New unlock timestamp (must be later than current unlock time).
     */
    function increaseUnlockTime(uint256 tokenId, uint256 unlockTime) external;

    /**
     * @notice Withdraw the underlying MEZO after the lock has fully expired.
     * @dev    Burns the NFT upon successful withdrawal.
     * @param  tokenId  ID of the expired veMEZO NFT.
     */
    function withdraw(uint256 tokenId) external;

    /**
     * @notice Claim pending rebase rewards (anti-dilution MEZO emissions) for a position.
     * @param  tokenId  ID of the veMEZO NFT.
     * @return amount   MEZO claimed (18-decimal units).
     */
    function claimRebase(uint256 tokenId) external returns (uint256 amount);

    /**
     * @notice Returns the current voting power of a veMEZO position.
     * @dev    Decays linearly to zero as the lock approaches its expiry timestamp.
     * @param  tokenId  ID of the veMEZO NFT.
     * @return          Voting power (18-decimal units).
     */
    function balanceOfNFT(uint256 tokenId) external view returns (uint256);

    /**
     * @notice Returns the locked amount and unlock timestamp for a position.
     * @param  tokenId  ID of the veMEZO NFT.
     * @return amount   Locked MEZO amount (int128, 18-decimal units).
     * @return end      Unix timestamp when the lock expires.
     */
    function locked(uint256 tokenId) external view returns (int128 amount, uint256 end);

    /// @notice Total number of veMEZO NFTs currently in existence.
    function totalSupply() external view returns (uint256);

    /// @notice Address of the underlying MEZO ERC-20 token held in lock positions.
    function token() external view returns (address);
}
