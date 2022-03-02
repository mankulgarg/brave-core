/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ads/internal/account/redeem_unblinded_token/user_data/confirmation_timestamp_dto_user_data.h"

#include "bat/ads/internal/unittest_base.h"
#include "bat/ads/internal/unittest_time_util.h"
#include "bat/ads/internal/unittest_util.h"

// npm run test -- brave_unit_tests --filter=BatAds*

namespace ads {

class BatAdsConfirmationTimestampDtoUserDataTest : public UnitTestBase {
 protected:
  BatAdsConfirmationTimestampDtoUserDataTest() = default;

  ~BatAdsConfirmationTimestampDtoUserDataTest() override = default;
};

TEST_F(BatAdsConfirmationTimestampDtoUserDataTest, GetTimestamp) {
  // Arrange

  // Act
  base::DictionaryValue timestamp = dto::user_data::GetTimestamp();

  // Assert
  base::DictionaryValue expected_timestamp;
  expected_timestamp.SetKey("timestamp", base::Value(NowAsISO8601()));

  EXPECT_EQ(expected_timestamp, timestamp);
}

}  // namespace ads
