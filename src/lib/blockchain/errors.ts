import {
  BaseError,
  ChainMismatchError,
  ContractFunctionRevertedError,
  HttpRequestError,
  InsufficientFundsError,
  TimeoutError,
  UserRejectedRequestError,
} from "viem";
import type { TransactionErrorKind } from "@/types/transaction";

type ClassifiedError = { kind: TransactionErrorKind; message: string };

const REVERT_MESSAGES: Record<string, string> = {
  ClaimTooSoon: "You already claimed test USDC in the last 24 hours. Try again later.",
  ReviewWindowNotOpen: "Reviews open once the submission deadline has passed.",
  SubmissionWindowOpen: "Winners can be selected after the submission deadline.",
  CreatorCannotReview: "The creator cannot review their own bounty.",
  AlreadyReviewed: "You already reviewed this bounty.",
  ReviewSlotsFull: "All review slots for this bounty are filled.",
  ConflictOfInterest: "Submitters cannot review their own bounty.",
  ScoreCountMismatch: "Score every submission before you submit the review.",
  InvalidScore: "Scores must be between 0 and 100.",
  NoSubmissions: "There is nothing to review yet.",
  EmptyEvidence: "Submission evidence cannot be empty.",
  NotCreator: "Only the bounty creator can do this.",
  NotOpen: "This bounty is already settled.",
  SubmissionWindowClosed: "The submission deadline has passed.",
  ReviewWindowClosed: "The review period has ended, so the winner can no longer be selected.",
  ReviewPeriodNotOver: "The review period has not ended yet.",
  CreatorCannotSubmit: "The creator cannot submit to their own bounty.",
  EmptyReference: "Submission evidence cannot be empty.",
  InvalidSubmissionIndex: "That submission does not exist.",
  BountyNotFound: "That bounty does not exist.",
  InvalidDeadline: "The deadline must be in the future.",
  InvalidReward: "The reward must be greater than zero.",
  InvalidToken: "The reward token is invalid.",
  OwnSubmission: "You cannot mark your own submission.",
  ERC20InsufficientBalance: "Not enough USDC in your wallet. Claim test USDC on the post page.",
  ERC20InsufficientAllowance: "Token approval is too low. Approve the amount and try again.",
};

const RPC_PATTERN =
  /429|rate limit|failed to fetch|network request failed|http request failed|timed out|timeout/i;

export function classifyTxError(error: unknown): ClassifiedError {
  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? revert.reason ?? "";
      return {
        kind: "contract_revert",
        message:
          REVERT_MESSAGES[name] ??
          `The contract rejected this transaction${name ? ` (${name})` : ""}.`,
      };
    }
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return { kind: "rejected", message: "You rejected the transaction in your wallet." };
    }
    if (error.walk((e) => e instanceof InsufficientFundsError)) {
      return {
        kind: "insufficient_funds",
        message: "Your wallet does not have enough MON to pay for gas.",
      };
    }
    if (error.walk((e) => e instanceof ChainMismatchError)) {
      return { kind: "wrong_network", message: "Switch your wallet to Monad Testnet to continue." };
    }
    if (error.walk((e) => e instanceof HttpRequestError || e instanceof TimeoutError)) {
      return {
        kind: "rpc",
        message: "The Monad RPC is busy or unreachable. Wait a moment and retry.",
      };
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/user (rejected|denied)|rejected the request/i.test(message)) {
    return { kind: "rejected", message: "You rejected the transaction in your wallet." };
  }
  if (/insufficient funds/i.test(message)) {
    return {
      kind: "insufficient_funds",
      message: "Your wallet does not have enough MON to pay for gas.",
    };
  }
  if (RPC_PATTERN.test(message)) {
    return {
      kind: "rpc",
      message: "The Monad RPC is busy or unreachable. Wait a moment and retry.",
    };
  }
  const named = Object.keys(REVERT_MESSAGES).find((name) =>
    new RegExp(`\\b${name}\\b`).test(message),
  );
  if (named) return { kind: "contract_revert", message: REVERT_MESSAGES[named] };
  if (/revert/i.test(message)) {
    return { kind: "contract_revert", message: "The contract rejected this transaction." };
  }
  return { kind: "unknown", message: error instanceof BaseError ? error.shortMessage : message };
}
