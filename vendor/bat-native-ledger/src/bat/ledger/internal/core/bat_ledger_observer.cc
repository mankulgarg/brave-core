/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ledger/internal/core/bat_ledger_observer.h"

namespace ledger {

const char BATLedgerObserver::kContextKey[] = "bat-ledger-observer";

void BATLedgerObserver::OnContributionCompleted() {
  // ledger_->ledger_client()->OnReconcileComplete
}

void BATLedgerObserver::OnAutoContributeCompleted() {
  // ledger_->ledger_client()->OnReconcileComplete
}

}  // namespace ledger
