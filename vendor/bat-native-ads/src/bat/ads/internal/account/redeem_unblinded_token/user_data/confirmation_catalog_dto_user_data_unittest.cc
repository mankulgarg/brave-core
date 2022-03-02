/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ads/internal/account/redeem_unblinded_token/user_data/confirmation_catalog_dto_user_data.h"

#include <string>
#include <utility>

#include "bat/ads/internal/ads_client_helper.h"
#include "bat/ads/internal/catalog/catalog_util.h"
#include "bat/ads/internal/unittest_base.h"
#include "bat/ads/internal/unittest_util.h"
#include "bat/ads/pref_names.h"

// npm run test -- brave_unit_tests --filter=BatAds*

namespace ads {

namespace {
constexpr char kCatalogId[] = "04a13086-8fd8-4dce-a44f-afe86f14a662";
}  // namespace

class BatAdsConfirmationCatalogDtoUserDataTest : public UnitTestBase {
 protected:
  BatAdsConfirmationCatalogDtoUserDataTest() = default;

  ~BatAdsConfirmationCatalogDtoUserDataTest() override = default;
};

TEST_F(BatAdsConfirmationCatalogDtoUserDataTest, GetCatalog) {
  // Arrange
  AdsClientHelper::Get()->SetStringPref(prefs::kCatalogId, kCatalogId);

  // Act
  base::DictionaryValue catalog = dto::user_data::GetCatalog();

  // Assert
  base::Value list(base::Value::Type::LIST);

  base::Value dictionary(base::Value::Type::DICTIONARY);
  const std::string catalog_id = GetCatalogId();
  dictionary.SetKey("id", base::Value(kCatalogId));
  list.Append(std::move(dictionary));

  base::DictionaryValue expected_catalog;
  expected_catalog.SetKey("catalog", std::move(list));

  EXPECT_EQ(expected_catalog, catalog);
}

}  // namespace ads
