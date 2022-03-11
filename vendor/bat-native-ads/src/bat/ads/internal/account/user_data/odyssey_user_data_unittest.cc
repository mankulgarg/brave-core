/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ads/internal/account/user_data/odyssey_user_data.h"

#include "base/values.h"
#include "bat/ads/internal/unittest_util.h"
#include "testing/gtest/include/gtest/gtest.h"

// npm run test -- brave_unit_tests --filter=BatAds*

namespace ads {

TEST(BatAdsOdysseyUserDataTest, GetOdysseyForGuest) {
  // Arrange
  mojom::SysInfo sys_info;
  sys_info.is_uncertain_future = true;
  SetSysInfo(sys_info);

  // Act
  const base::DictionaryValue odyssey = user_data::GetOdyssey();

  // Assert
  base::DictionaryValue expected_odyssey;
  expected_odyssey.SetKey("odyssey", base::Value("guest"));

  EXPECT_EQ(expected_odyssey, odyssey);
}

TEST(BatAdsOdysseyUserDataTest, GetOdysseyForHost) {
  // Arrange
  mojom::SysInfo sys_info;
  sys_info.is_uncertain_future = false;
  SetSysInfo(sys_info);

  // Act
  const base::DictionaryValue odyssey = user_data::GetOdyssey();

  // Assert
  base::DictionaryValue expected_odyssey;
  expected_odyssey.SetKey("odyssey", base::Value("host"));

  EXPECT_EQ(expected_odyssey, odyssey);
}

}  // namespace ads
