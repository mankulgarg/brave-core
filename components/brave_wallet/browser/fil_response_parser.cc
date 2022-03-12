/* Copyright (c) 2021 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "brave/components/brave_wallet/browser/fil_response_parser.h"

#include <memory>
#include <utility>

#include "base/json/json_reader.h"
#include "base/logging.h"
#include "base/strings/string_number_conversions.h"
#include "brave/components/brave_wallet/browser/brave_wallet_utils.h"
#include "brave/components/brave_wallet/browser/json_rpc_response_parser.h"
#include "brave/components/brave_wallet/common/brave_wallet_types.h"
#include "brave/components/brave_wallet/common/hex_utils.h"
#include "third_party/jsoncpp/source/include/json/reader.h"
#include "third_party/jsoncpp/source/include/json/value.h"

namespace brave_wallet {

bool ParseFilGetBalance(const std::string& json, std::string* balance) {
  return brave_wallet::ParseSingleStringResult(json, balance);
}

bool ParseFilGetTransactionCount(const std::string& json, uint64_t* count) {
  // Default base::JSONReader is unable to parse uint64 values.
  // Taking third_party/jsoncpp to parse payload in this case because
  // https://github.com/filecoin-project/lotus/blob/master/chain/types/message.go#L36
  // the nonce has uint64 type.
  base::Value result;
  Json::CharReaderBuilder builder;
  Json::CharReaderBuilder::strictMode(&builder.settings_);
  std::unique_ptr<Json::CharReader> reader(builder.newCharReader());
  Json::Value root_node;
  std::string error_msg;
  const bool succeeded = reader->parse(json.data(), json.data() + json.length(),
                                       &root_node, &error_msg);
  if (!succeeded || !root_node) {
    return false;
  }
  if (!root_node["result"] || !root_node["result"].isUInt64()) {
    return false;
  }
  *count = root_node["result"].asUInt64();
  return true;
}

}  // namespace brave_wallet
