/* Copyright (c) 2019 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ads/internal/frequency_capping/permission_rules/minimum_wait_time_permission_rule.h"

#include <cstdint>

#include "base/time/time.h"
#include "bat/ads/ad_type.h"
#include "bat/ads/confirmation_type.h"
#include "bat/ads/internal/ad_events/ad_events.h"
#include "bat/ads/internal/frequency_capping/frequency_capping_util.h"
#include "bat/ads/internal/platform/platform_helper.h"
#include "bat/ads/internal/settings/settings.h"

namespace ads {

namespace {
const int kMinimumWaitTimeFrequencyCap = 1;
}  // namespace

MinimumWaitTimePermissionRule::MinimumWaitTimePermissionRule() = default;

MinimumWaitTimePermissionRule::~MinimumWaitTimePermissionRule() = default;

bool MinimumWaitTimePermissionRule::ShouldAllow() {
  if (PlatformHelper::GetInstance()->IsMobile()) {
    // Ads are periodically served on mobile so they will never be served before
    // the minimum wait time has passed
    return true;
  }

  const std::deque<base::Time>& history =
      GetAdEvents(AdType::kAdNotification, ConfirmationType::kServed);

  if (!DoesRespectCap(history)) {
    last_message_ = "Ad cannot be shown as minimum wait time has not passed";
    return false;
  }

  return true;
}

std::string MinimumWaitTimePermissionRule::GetLastMessage() const {
  return last_message_;
}

bool MinimumWaitTimePermissionRule::DoesRespectCap(
    const std::deque<base::Time>& history) {
  const uint64_t ads_per_hour = settings::GetAdsPerHour();
  if (ads_per_hour == 0) {
    return false;
  }

  const base::TimeDelta& time_constraint =
      base::Seconds(base::Time::kSecondsPerHour / ads_per_hour);

  return DoesHistoryRespectCapForRollingTimeConstraint(
      history, time_constraint, kMinimumWaitTimeFrequencyCap);
}

}  // namespace ads
