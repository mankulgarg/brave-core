/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ads/internal/account/redeem_unblinded_token/user_data/confirmation_catalog_dto_user_data.h"

#include <string>
#include <utility>

#include "base/values.h"
#include "bat/ads/internal/catalog/catalog_util.h"

namespace ads {
namespace dto {
namespace user_data {

base::DictionaryValue GetCatalog() {
  base::Value list(base::Value::Type::LIST);

  base::Value dictionary(base::Value::Type::DICTIONARY);
  const std::string catalog_id = GetCatalogId();
  dictionary.SetKey("id", base::Value(catalog_id));
  list.Append(std::move(dictionary));

  base::DictionaryValue user_data;
  user_data.SetKey("catalog", std::move(list));

  return user_data;
}

}  // namespace user_data
}  // namespace dto
}  // namespace ads
