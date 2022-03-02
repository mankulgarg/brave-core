/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ads/internal/account/redeem_unblinded_token/user_data/confirmation_timestamp_dto_user_data.h"

#include "base/time/time.h"
#include "base/time/time_to_iso8601.h"
#include "base/values.h"

namespace ads {
namespace dto {
namespace user_data {

base::DictionaryValue GetTimestamp() {
  base::DictionaryValue user_data;
  user_data.SetKey("timestamp",
                   base::Value(base::TimeToISO8601(base::Time::Now())));

  return user_data;
}

}  // namespace user_data
}  // namespace dto
}  // namespace ads
