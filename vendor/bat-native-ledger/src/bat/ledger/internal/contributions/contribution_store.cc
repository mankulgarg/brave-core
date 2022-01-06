/* Copyright (c) 2022 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "bat/ledger/internal/contributions/contribution_store.h"

#include <string>
#include <utility>
#include <vector>

#include "base/strings/string_number_conversions.h"
#include "bat/ledger/internal/core/bat_ledger_job.h"
#include "bat/ledger/internal/core/sql_store.h"

namespace ledger {

namespace {

const char kLastScheduledContributionKey[] = "last-scheduled-contribution";

using base::BindOnce;

class SaveCompletedContributionJob : public BATLedgerJob<bool> {
 public:
  void Start(const Contribution& contribution) {
    std::string report_id = GetCurrentBalanceReportID();

    SQLStore::CommandList commands;
    commands.push_back(CreateReportInsertCommand(report_id));
    commands.push_back(CreateReportUpdateCommand(report_id, contribution));
    commands.push_back(CreateContributionInfoInsertCommand(contribution));
    commands.push_back(CreateContributionPublisherInsertCommand(contribution));

    CompleteWith(context()
                     .Get<SQLStore>()
                     .RunTransaction(std::move(commands))
                     .Then(BindOnce(
                         [](SQLReader reader) { return reader.Succeeded(); })));
  }

 private:
  static std::string GetCurrentBalanceReportID() {
    base::Time::Exploded exploded_now;
    base::Time::Now().UTCExplode(&exploded_now);
    DCHECK(exploded_now.HasValidValues());
    return base::NumberToString(exploded_now.year) + "_" +
           base::NumberToString(exploded_now.month);
  }

  static SQLStore::Command CreateReportInsertCommand(
      const std::string& report_id) {
    static const char kSQL[] = R"sql(
      INSERT OR IGNORE INTO balance_report_info (balance_report_id)
      VALUES (?)
    )sql";

    return SQLStore::CreateCommand(kSQL, report_id);
  }

  static SQLStore::Command CreateReportUpdateCommand(
      const std::string& report_id,
      const Contribution& contribution) {
    static const char kSQL[] = R"sql(
      UPDATE balance_report_info
      SET auto_contribute = auto_contribute + ?,
          tip_recurring = tip_recurring + ?,
          tip = tip + ?
      WHERE balance_report_id = ?
    )sql";

    double auto_contribute_value = 0;
    double recurring_tip_value = 0;
    double tip_value = 0;

    switch (contribution.type) {
      case ContributionType::kOneTime:
        tip_value = contribution.amount;
        break;
      case ContributionType::kRecurring:
        recurring_tip_value = contribution.amount;
        break;
      case ContributionType::kAutoContribute:
        auto_contribute_value = contribution.amount;
        break;
    }

    return SQLStore::CreateCommand(kSQL, auto_contribute_value,
                                   recurring_tip_value, tip_value, report_id);
  }

  static mojom::RewardsType GetRewardsType(ContributionType type) {
    switch (type) {
      case ContributionType::kOneTime:
        return mojom::RewardsType::ONE_TIME_TIP;
      case ContributionType::kRecurring:
        return mojom::RewardsType::RECURRING_TIP;
      case ContributionType::kAutoContribute:
        return mojom::RewardsType::AUTO_CONTRIBUTE;
    }
  }

  static SQLStore::Command CreateContributionInfoInsertCommand(
      const Contribution& contribution) {
    static const char kSQL[] = R"sql(
      INSERT INTO contribution_info (contribution_id, amount, type, step,
        retry_count, created_at, processor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    )sql";

    SQLStore::CommandList commands;

    // TODO(zenparsing): This table expects a processor, which we don't actually
    // have in Contribution. Do we need it?

    // TODO(zenparsing): This will result in multiple rows getting displayed for
    // a single "AC" in the monthly report.

    return SQLStore::CreateCommand(
        kSQL, contribution.id, contribution.amount,
        static_cast<int64_t>(GetRewardsType(contribution.type)),
        static_cast<int64_t>(mojom::ContributionStep::STEP_COMPLETED), 0,
        base::Time::Now().ToDoubleT(), 0);
  }

  static SQLStore::Command CreateContributionPublisherInsertCommand(
      const Contribution& contribution) {
    static const char kSQL[] = R"sql(
      INSERT INTO contribution_info_publishers (contribution_id, publisher_key,
        total_amount, contributed_amount)
      VALUES (?, ?, ?, ?)
    )sql";

    return SQLStore::CreateCommand(kSQL, contribution.id,
                                   contribution.publisher_id,
                                   contribution.amount, contribution.amount);
  }
};

}  // namespace

const char ContributionStore::kContextKey[] = "contibution-store";

Future<bool> ContributionStore::SaveCompletedContribution(
    const Contribution& contribution) {
  return context().StartJob<SaveCompletedContributionJob>(contribution);
}

Future<bool> ContributionStore::SavePendingContribution(
    const std::string& publisher_id,
    double amount) {
  return SavePendingContribution(publisher_id, amount, base::Time::Now());
}

Future<bool> ContributionStore::SavePendingContribution(
    const std::string& publisher_id,
    double amount,
    base::Time created_at) {
  static const char kSQL[] = R"sql(
    INSERT INTO contribution_pending (publisher_id, amount, created_at)
    VALUES (?, ?, ?)
  )sql";

  return context()
      .Get<SQLStore>()
      .Run(kSQL, publisher_id, amount, SQLStore::TimeString(created_at))
      .Then(BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<std::vector<PendingContribution>>
ContributionStore::GetPendingContributions() {
  static const char kSQL[] = R"sql(
    SELECT ROWID, publisher_id, amount, created_at FROM contribution_pending
  )sql";

  return context().Get<SQLStore>().Query(kSQL).Then(
      BindOnce([](SQLReader reader) {
        std::vector<PendingContribution> contributions;
        while (reader.Step()) {
          contributions.push_back(
              {.id = reader.ColumnInt64(0),
               .publisher_id = reader.ColumnString(1),
               .amount = reader.ColumnDouble(2),
               .created_at = SQLStore::ParseTime(reader.ColumnString(3))});
        }
        return contributions;
      }));
}

Future<bool> ContributionStore::DeletePendingContribution(int64_t id) {
  static const char kSQL[] = R"sql(
      DELETE FROM contribution_pending WHERE ROWID = ?
    )sql";

  return context().Get<SQLStore>().Run(kSQL, id).Then(
      BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<bool> ContributionStore::ClearPendingContributions() {
  static const char kSQL[] = R"sql(DELETE FROM contribution_pending)sql";

  return context().Get<SQLStore>().Run(kSQL).Then(
      BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<bool> ContributionStore::SetPublisherAutoContributeEnabled(
    const std::string& publisher_id,
    bool enabled) {
  static const char kEnable[] = R"sql(
    UPDATE contribution_activity
    SET enabled = 1
    WHERE publisher_id = ?
  )sql";

  static const char kDisable[] = R"sql(
    INSERT OR REPLACE INTO contribution_activity (publisher_id, enabled)
    VALUES (?, 0)
  )sql";

  return context()
      .Get<SQLStore>()
      .Run(enabled ? kEnable : kDisable, publisher_id)
      .Then(BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<bool> ContributionStore::ResetPublisherAutoContributeEnabled() {
  static const char kSQL[] = R"sql(
    UPDATE contribution_activity SET enabled = 1
  )sql";

  return context().Get<SQLStore>().Run(kSQL).Then(
      BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<bool> ContributionStore::AddPublisherActivity(
    const std::string& publisher_id,
    int visit_count,
    base::TimeDelta duration) {
  if (visit_count < 0) {
    NOTREACHED();
    visit_count = 0;
  }

  static const char kInsert[] = R"sql(
    INSERT OR IGNORE INTO contribution_activity (publisher_id) VALUES (?)
  )sql";

  static const char kUpdate[] = R"sql(
    UPDATE contribution_activity
    SET visits = visits + ?, duration = duration + ?
    WHERE publisher_id = ? AND enabled = 1
  )sql";

  return context()
      .Get<SQLStore>()
      .RunTransaction(
          SQLStore::CreateCommand(kInsert, publisher_id),
          SQLStore::CreateCommand(kUpdate, visit_count, duration.InSecondsF(),
                                  publisher_id))
      .Then(BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<std::vector<PublisherActivity>>
ContributionStore::GetPublisherActivity() {
  static const char kSQL[] = R"sql(
    SELECT publisher_id, visits, duration
    FROM contribution_activity
    WHERE duration > 0 AND enabled = 1
  )sql";

  return context().Get<SQLStore>().Query(kSQL).Then(
      BindOnce([](SQLReader reader) {
        std::vector<PublisherActivity> publishers;
        while (reader.Step()) {
          publishers.push_back(
              {.publisher_id = reader.ColumnString(0),
               .visits = reader.ColumnInt64(1),
               .duration = base::Seconds(reader.ColumnDouble(2))});
        }
        return publishers;
      }));
}

Future<bool> ContributionStore::ResetPublisherActivity() {
  static const char kSQL[] = R"sql(
    UPDATE contribution_activity SET visits = 0, duration = 0
  )sql";

  return context().Get<SQLStore>().Run(kSQL).Then(
      BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<std::vector<RecurringContribution>>
ContributionStore::GetRecurringContributions() {
  static const char kSQL[] = R"sql(
    SELECT publisher_id, amount
    FROM contribution_recurring
    WHERE amount > 0
  )sql";

  return context().Get<SQLStore>().Query(kSQL).Then(
      BindOnce([](SQLReader reader) {
        std::vector<RecurringContribution> contributions;
        while (reader.Step()) {
          contributions.push_back({.publisher_id = reader.ColumnString(0),
                                   .amount = reader.ColumnDouble(1)});
        }
        return contributions;
      }));
}

Future<bool> ContributionStore::SetRecurringContribution(
    const std::string& publisher_id,
    double amount) {
  if (amount < 0) {
    return DeleteRecurringContribution(publisher_id);
  }

  static const char kSQL[] = R"sql(
    INSERT OR REPLACE INTO contribution_recurring (publisher_id, amount)
    VALUES (?, ?)
  )sql";

  return context()
      .Get<SQLStore>()
      .Run(kSQL, publisher_id, amount)
      .Then(BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<bool> ContributionStore::DeleteRecurringContribution(
    const std::string& publisher_id) {
  static const char kSQL[] = R"sql(
    DELETE FROM contribution_recurring WHERE publisher_id = ?
  )sql";

  return context()
      .Get<SQLStore>()
      .Run(kSQL, publisher_id)
      .Then(BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

Future<base::Time> ContributionStore::GetLastScheduledContributionTime() {
  static const char kInsert[] = R"sql(
    INSERT OR IGNORE INTO dictionary (key, value) VALUES (?, ?)
  )sql";

  static const char kSelect[] = R"sql(
    SELECT value FROM dictionary WHERE key = ?
  )sql";

  return context()
      .Get<SQLStore>()
      .RunTransaction(
          SQLStore::CreateCommand(kInsert, kLastScheduledContributionKey,
                                  SQLStore::TimeString()),
          SQLStore::CreateQuery(kSelect, kLastScheduledContributionKey))
      .Then(BindOnce([](SQLReader reader) {
        if (reader.Step()) {
          return SQLStore::ParseTime(reader.ColumnString(0));
        } else {
          NOTREACHED();
          return base::Time::Now();
        }
      }));
}

Future<bool> ContributionStore::UpdateLastScheduledContributionTime() {
  static const char kSQL[] = R"sql(
    UPDATE dictionary SET value = ? WHERE key = ?
  )sql";

  return context()
      .Get<SQLStore>()
      .Run(kSQL, SQLStore::TimeString(), kLastScheduledContributionKey)
      .Then(BindOnce([](SQLReader reader) { return reader.Succeeded(); }));
}

}  // namespace ledger
