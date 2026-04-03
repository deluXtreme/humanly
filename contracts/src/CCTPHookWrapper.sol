// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import { IReceiverV2 } from "@circlefin/evm-cctp-contracts/src/interfaces/v2/IReceiverV2.sol";
import { TypedMemView } from "@memview-sol/contracts/TypedMemView.sol";
import { MessageV2 } from "@circlefin/evm-cctp-contracts/src/messages/v2/MessageV2.sol";
import { BurnMessageV2 } from "@circlefin/evm-cctp-contracts/src/messages/v2/BurnMessageV2.sol";
import { Ownable2Step } from "@circlefin/evm-cctp-contracts/src/roles/Ownable2Step.sol";

contract CCTPAuction is Ownable2Step { }
