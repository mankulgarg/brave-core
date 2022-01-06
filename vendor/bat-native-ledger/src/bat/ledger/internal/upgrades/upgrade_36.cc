/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ledger/internal/upgrades/upgrade_36.h"

#include "bat/ledger/internal/upgrades/migration_job.h"

namespace ledger {

namespace {

// TODO(zenparsing): Index on job_state.job_type.

const char kSQL[] = R"sql(

  CREATE TABLE IF NOT EXISTS contribution (
    contribution_id TEXT NOT NULL PRIMARY KEY,
    contribution_type TEXT NOT NULL,
    publisher_id TEXT NOT NULL,
    amount REAL NOT NULL,
    source TEXT NOT NULL,
    completed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contribution_activity (
    publisher_id TEXT NOT NULL PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    visits INTEGER NOT NULL DEFAULT 0,
    duration REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contribution_recurring (
    publisher_id TEXT NOT NULL PRIMARY KEY,
    amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contribution_pending (
    publisher_id TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_state (
    job_id TEXT NOT NULL PRIMARY KEY,
    job_type TEXT NOT NULL,
    state TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS dictionary (
    key TEXT NOT NULL PRIMARY KEY,
    value TEXT
  );

)sql";

}  // namespace

constexpr int Upgrade36::kVersion;

void Upgrade36::Start() {
  CompleteWith(context().StartJob<MigrationJob>(kVersion, kSQL));
}

}  // namespace ledger
