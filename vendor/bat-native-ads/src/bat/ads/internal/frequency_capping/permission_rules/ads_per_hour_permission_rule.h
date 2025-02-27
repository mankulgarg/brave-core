/* Copyright (c) 2019 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef BRAVE_VENDOR_BAT_NATIVE_ADS_SRC_BAT_ADS_INTERNAL_FREQUENCY_CAPPING_PERMISSION_RULES_ADS_PER_HOUR_PERMISSION_RULE_H_
#define BRAVE_VENDOR_BAT_NATIVE_ADS_SRC_BAT_ADS_INTERNAL_FREQUENCY_CAPPING_PERMISSION_RULES_ADS_PER_HOUR_PERMISSION_RULE_H_

#include <deque>
#include <string>

#include "bat/ads/internal/frequency_capping/permission_rules/permission_rule.h"

namespace base {
class Time;
}  // namespace base

namespace ads {

class AdsPerHourPermissionRule final : public PermissionRule {
 public:
  AdsPerHourPermissionRule();
  ~AdsPerHourPermissionRule() override;

  bool ShouldAllow() override;

  std::string GetLastMessage() const override;

 private:
  std::string last_message_;

  bool DoesRespectCap(const std::deque<base::Time>& history);

  AdsPerHourPermissionRule(const AdsPerHourPermissionRule&) = delete;
  AdsPerHourPermissionRule& operator=(const AdsPerHourPermissionRule&) = delete;
};

}  // namespace ads

#endif  // BRAVE_VENDOR_BAT_NATIVE_ADS_SRC_BAT_ADS_INTERNAL_FREQUENCY_CAPPING_PERMISSION_RULES_ADS_PER_HOUR_PERMISSION_RULE_H_
