import type {
  Account,
  Chain,
  PublicActions,
  Transport,
  WalletClient,
} from "viem";

export type ClientWithPublicActions = WalletClient<
  Transport,
  Chain,
  Account
> &
  PublicActions;
