import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Deposited,
  Withdrawn,
  Compounded,
} from "../generated/VeMEZOAutoCompounder/VeMEZOAutoCompounder";
import { Vault, User, Deposit, Withdrawal, Compound, DailyMetric } from "../generated/schema";

const VAULT_ID = "vemezo-auto-compounder";
const SECONDS_PER_DAY = 86400;

function getOrCreateVault(): Vault {
  let vault = Vault.load(VAULT_ID);
  if (!vault) {
    vault = new Vault(VAULT_ID);
    vault.totalUnderlying = BigInt.zero();
    vault.totalShares = BigInt.zero();
    vault.performanceFee = 1000;
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
  }
  return metric;
}

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
