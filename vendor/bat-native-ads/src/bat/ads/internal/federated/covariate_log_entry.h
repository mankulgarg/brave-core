/* Copyright 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef BRAVE_VENDOR_BAT_NATIVE_ADS_SRC_BAT_ADS_INTERNAL_FEDERATED_COVARIATE_LOG_ENTRY_H_
#define BRAVE_VENDOR_BAT_NATIVE_ADS_SRC_BAT_ADS_INTERNAL_FEDERATED_COVARIATE_LOG_ENTRY_H_

#include <string>

#include "bat/ads/public/interfaces/ads.mojom.h"

namespace ads {

class CovariateLogEntry {
 public:
  CovariateLogEntry();
  virtual ~CovariateLogEntry();

  virtual mojom::DataType GetDataType() const = 0;
  virtual mojom::CovariateType GetCovariateType() const = 0;
  virtual std::string GetValue() const = 0;
};

}  // namespace ads

#endif  // BRAVE_VENDOR_BAT_NATIVE_ADS_SRC_BAT_ADS_INTERNAL_FEDERATED_COVARIATE_LOG_ENTRY_H_
