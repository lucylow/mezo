import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Deposited,
  Withdrawn,
  Compounded,
  FeeDistributed,
  FeeCollected,
  TreasuryStaked,
  RewardsClaimed,
  GaugesVoted,
} from "../generated/VeMEZOAutoCompounder/VeMEZOAutoCompounder";
import {
  ProposalCreated,
  VoteCast,
  ProposalExecuted,
  ProposalCanceled,
  ProposalQueued,
} from "../generated/VaultGovernor/VaultGovernor";
import {
  CallScheduled,
  CallExecuted,
  Cancelled,
} from "../generated/VaultTimelockController/VaultTimelockController";
import {
  Vault,
  User,
  Deposit,
  Withdrawal,
  Compound,
  FeeDistribution,
  FeeCollected as FeeCollectedEntity,
  TreasuryStaked as TreasuryStakedEntity,
  UserRewardClaim,
  DailyMetric,
  GovernanceProposal,
  GovernanceVote,
  TimelockOperation,
  EpochVote,
} from "../generated/schema";

const VAULT_ID = "vemezo-auto-compounder";
const SECONDS_PER_DAY = 86400;

// ── Helpers ────────────────────────────────────────────────────────────────

function getOrCreateVault(): Vault {
  let vault = Vault.load(VAULT_ID);
  if (!vault) {
    vault = new Vault(VAULT_ID);
    vault.totalUnderlying = BigInt.zero();
    vault.totalShares = BigInt.zero();
    vault.performanceFee = 1000;
    vault.feeDistributionRate = 5000;
    vault.lastCompoundTime = BigInt.zero();
    vault.totalDeposits = 0;
    vault.totalCompounded = BigInt.zero();
    vault.totalFeesCollected = BigInt.zero();
    vault.createdAt = BigInt.zero();
    vault.updatedAt = BigInt.zero();
  }
  return vault;
}

function getOrCreateUser(address: Bytes): User {
  let id = address.toHexString();
  let user = User.load(id);
  if (!user) {
    user = new User(id);
    user.address = address;
    user.shareBalance = BigInt.zero();
    user.underlyingValue = BigInt.zero();
    user.tokenIds = [];
    user.totalRewardsClaimed = BigInt.zero();
    user.createdAt = BigInt.zero();
    user.updatedAt = BigInt.zero();
  }
  return user;
}

function getOrCreateDailyMetric(timestamp: BigInt): DailyMetric {
  let date = timestamp.toI32() / SECONDS_PER_DAY;
  let id = date.toString();
  let metric = DailyMetric.load(id);
  if (!metric) {
    metric = new DailyMetric(id);
    metric.date = date;
    metric.tvl = BigInt.zero();
    metric.totalShares = BigInt.zero();
    metric.totalUsers = 0;
    metric.dailyRewards = BigInt.zero();
    metric.dailyFees = BigInt.zero();
    metric.dailyFeesToHolders = BigInt.zero();
    metric.dailyFeesToTreasury = BigInt.zero();
  }
  return metric;
}

// ── Vault event handlers ───────────────────────────────────────────────────

export function handleDeposited(event: Deposited): void {
  let vault = getOrCreateVault();
  let user = getOrCreateUser(event.params.user);

  vault.totalUnderlying = vault.totalUnderlying.plus(event.params.value);
  vault.totalShares = vault.totalShares.plus(event.params.shares);
  vault.totalDeposits += 1;
  vault.updatedAt = event.block.timestamp;
  if (vault.createdAt.isZero()) vault.createdAt = event.block.timestamp;

  let tokenIds = user.tokenIds;
  tokenIds.push(event.params.tokenId.toString());
  user.tokenIds = tokenIds;
  user.shareBalance = user.shareBalance.plus(event.params.shares);
  user.underlyingValue = user.underlyingValue.plus(event.params.value);
  user.updatedAt = event.block.timestamp;
  if (user.createdAt.isZero()) user.createdAt = event.block.timestamp;

  let deposit = new Deposit(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  deposit.user = user.id;
  deposit.tokenId = event.params.tokenId;
  deposit.value = event.params.value;
  deposit.shares = event.params.shares;
  deposit.transactionHash = event.transaction.hash;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.save();

  let metric = getOrCreateDailyMetric(event.block.timestamp);
  metric.tvl = vault.totalUnderlying;
  metric.totalShares = vault.totalShares;
  metric.totalUsers = vault.totalDeposits;
  metric.save();

  vault.save();
  user.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let vault = getOrCreateVault();
  let user = getOrCreateUser(event.params.user);

  vault.totalUnderlying = vault.totalUnderlying.minus(event.params.value);
  vault.totalShares = vault.totalShares.minus(event.params.shares);
  vault.updatedAt = event.block.timestamp;

  let tokenIds = user.tokenIds;
  let idx = tokenIds.indexOf(event.params.tokenId.toString());
  if (idx >= 0) tokenIds.splice(idx, 1);
  user.tokenIds = tokenIds;
  user.shareBalance = user.shareBalance.minus(event.params.shares);
  user.underlyingValue = user.underlyingValue.minus(event.params.value);
  user.updatedAt = event.block.timestamp;

  let withdrawal = new Withdrawal(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  withdrawal.user = user.id;
  withdrawal.tokenId = event.params.tokenId;
  withdrawal.value = event.params.value;
  withdrawal.shares = event.params.shares;
  withdrawal.transactionHash = event.transaction.hash;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.save();

  let metric = getOrCreateDailyMetric(event.block.timestamp);
  metric.tvl = vault.totalUnderlying;
  metric.totalShares = vault.totalShares;
  metric.save();

  vault.save();
  user.save();
}

export function handleCompounded(event: Compounded): void {
  let vault = getOrCreateVault();

  vault.totalCompounded = vault.totalCompounded.plus(event.params.amountCompounded);
  vault.totalFeesCollected = vault.totalFeesCollected.plus(event.params.fee);
  vault.lastCompoundTime = event.block.timestamp;
  vault.updatedAt = event.block.timestamp;

  let compound = new Compound(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  compound.totalRewards = event.params.totalRewards;
  compound.fee = event.params.fee;
  compound.amountCompounded = event.params.amountCompounded;
  compound.transactionHash = event.transaction.hash;
  compound.blockNumber = event.block.number;
  compound.timestamp = event.block.timestamp;
  compound.save();

  let metric = getOrCreateDailyMetric(event.block.timestamp);
  metric.dailyRewards = metric.dailyRewards.plus(event.params.totalRewards);
  metric.dailyFees = metric.dailyFees.plus(event.params.fee);
  metric.save();

  vault.save();
}

export function handleFeeDistributed(event: FeeDistributed): void {
  let feeDist = new FeeDistribution(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  feeDist.totalFee = event.params.totalFee;
  feeDist.toHolders = event.params.toHolders;
  feeDist.toTreasury = event.params.toTreasury;
  feeDist.transactionHash = event.transaction.hash;
  feeDist.blockNumber = event.block.number;
  feeDist.timestamp = event.block.timestamp;
  feeDist.save();

  let metric = getOrCreateDailyMetric(event.block.timestamp);
  metric.dailyFeesToHolders = metric.dailyFeesToHolders.plus(event.params.toHolders);
  metric.dailyFeesToTreasury = metric.dailyFeesToTreasury.plus(event.params.toTreasury);
  metric.save();
}

/**
 * Handles RewardsClaimed — emitted when a vveMEZO holder calls claimFeeRewards().
 * This is the authoritative handler for user MUSD fee reward claims.
 */
export function handleRewardsClaimed(event: RewardsClaimed): void {
  let user = getOrCreateUser(event.params.user);
  user.totalRewardsClaimed = user.totalRewardsClaimed.plus(event.params.amount);
  user.updatedAt = event.block.timestamp;
  user.save();

  let claim = new UserRewardClaim(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  claim.user = user.id;
  claim.amount = event.params.amount;
  claim.transactionHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.timestamp = event.block.timestamp;
  claim.save();
}

export function handleFeeCollected(event: FeeCollected): void {
  let entity = new FeeCollectedEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  entity.mezoAmount = event.params.mezoAmount;
  entity.musdAmount = event.params.musdAmount;
  entity.treasury = event.params.treasury;
  entity.transactionHash = event.transaction.hash;
  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.save();

  let vault = getOrCreateVault();
  vault.totalFeesCollected = vault.totalFeesCollected.plus(event.params.musdAmount);
  vault.updatedAt = event.block.timestamp;
  vault.save();
}

export function handleTreasuryStaked(event: TreasuryStaked): void {
  let entity = new TreasuryStakedEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  entity.musdAmount = event.params.musdAmount;
  entity.sMUSDShares = event.params.sharesReceived;
  entity.transactionHash = event.transaction.hash;
  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.save();
}

export function handleGaugesVoted(event: GaugesVoted): void {
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let ev = new EpochVote(id);
  ev.epochTimestamp = event.params.epochTimestamp;
  ev.tokenCount = event.params.tokenCount;
  ev.gaugeCount = event.params.gaugeCount;
  ev.transactionHash = event.transaction.hash;
  ev.blockNumber = event.block.number;
  ev.timestamp = event.block.timestamp;
  ev.save();
}

// ── Governor event handlers ────────────────────────────────────────────────

export function handleProposalCreated(event: ProposalCreated): void {
  let proposal = new GovernanceProposal(event.params.proposalId.toString());
  proposal.proposalId = event.params.proposalId;
  proposal.proposer = event.params.proposer;
  proposal.description = event.params.description;

  let targets: Bytes[] = [];
  for (let i = 0; i < event.params.targets.length; i++) {
    targets.push(event.params.targets[i]);
  }
  proposal.targets = targets;

  let calldatas: Bytes[] = [];
  for (let i = 0; i < event.params.calldatas.length; i++) {
    calldatas.push(event.params.calldatas[i]);
  }
  proposal.calldatas = calldatas;

  proposal.startBlock = event.params.voteStart;
  proposal.endBlock = event.params.voteEnd;
  proposal.status = "PENDING";
  proposal.forVotes = BigInt.zero();
  proposal.againstVotes = BigInt.zero();
  proposal.abstainVotes = BigInt.zero();
  proposal.executed = false;
  proposal.createdAt = event.block.timestamp;
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleVoteCast(event: VoteCast): void {
  let proposal = GovernanceProposal.load(event.params.proposalId.toString());
  if (!proposal) return;

  if (event.params.support == 0) {
    proposal.againstVotes = proposal.againstVotes.plus(event.params.weight);
  } else if (event.params.support == 1) {
    proposal.forVotes = proposal.forVotes.plus(event.params.weight);
  } else {
    proposal.abstainVotes = proposal.abstainVotes.plus(event.params.weight);
  }
  proposal.status = "ACTIVE";
  proposal.updatedAt = event.block.timestamp;
  proposal.save();

  let vote = new GovernanceVote(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  vote.proposal = proposal.id;
  vote.voter = event.params.voter;
  vote.support = event.params.support;
  vote.weight = event.params.weight;
  vote.reason = event.params.reason;
  vote.transactionHash = event.transaction.hash;
  vote.blockNumber = event.block.number;
  vote.timestamp = event.block.timestamp;
  vote.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let proposal = GovernanceProposal.load(event.params.proposalId.toString());
  if (!proposal) return;
  proposal.status = "EXECUTED";
  proposal.executed = true;
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  let proposal = GovernanceProposal.load(event.params.proposalId.toString());
  if (!proposal) return;
  proposal.status = "CANCELED";
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleProposalQueued(event: ProposalQueued): void {
  let proposal = GovernanceProposal.load(event.params.proposalId.toString());
  if (!proposal) return;
  proposal.status = "QUEUED";
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

// ── Timelock event handlers ────────────────────────────────────────────────

export function handleCallScheduled(event: CallScheduled): void {
  let op = new TimelockOperation(event.params.id.toHexString());
  op.operationId = event.params.id;
  op.target = event.params.target;
  op.value = event.params.value;
  op.data = event.params.data;
  op.predecessor = event.params.predecessor;
  op.delay = event.params.delay;
  op.status = "SCHEDULED";
  op.scheduledAt = event.block.timestamp;
  op.executedAt = null;
  op.save();
}

export function handleCallExecuted(event: CallExecuted): void {
  let op = TimelockOperation.load(event.params.id.toHexString());
  if (!op) return;
  op.status = "EXECUTED";
  op.executedAt = event.block.timestamp;
  op.save();
}

export function handleCancelled(event: Cancelled): void {
  let op = TimelockOperation.load(event.params.id.toHexString());
  if (!op) return;
  op.status = "CANCELLED";
  op.save();
}
