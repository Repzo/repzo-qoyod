# Release Notes

## [v1.0.0 (2022-04-18)](https://github.com/Repzo/repzo-qoyod.git)

### Added

- [actions/create_client] update repzo_client_integration_meta with qoyod_client_id @maramalshen
- [./src/commands/tax] new Command: Tax @maramalshen
- [./src/commands/product] implement tax key in the product @maramalshen
- [./src/commands/measureunit_family.ts] new Command: Measure Unit Family @maramalshen
- [./src/commands/product] handle product.track_quantity as product.frozen @maramalshen
- [./src/actions/create_invoice] create invoice in Qoyod @maramalshen
- [./src/actions/create_payment] create payment in Qoyod @maramalshen
- Handle Bench time in the Commands @maramalshen
- Command Logs @maramalshen
- Action Logs @maramalshen
- [./src/commands/join] new Command: Join @maramalshen
- [./src/actions/create_invoice] read key invoice.status from settings @maramalshen
- New Actions: Transfer & Sync_Client @maramalshen
- always inject body in response in the actions @maramalshen
- divide create_payment to create_invoice_payment & create_receipt @maramalshen
- [actions/create_refund] new action: refund @maramalshen
- [actions/create_return_invoice] new action: credit notes @maramalshen
- Update Error Logs in Actions & Commands @maramalshen
- Inject Body of the action in the details.meta @maramalshen
- [actions/create_refund] refund.account_id = rep.integration_meta.qoyod_refund_account_id || options.data.refundAccountId @maramalshen
- [command/username_account_id] new command: sync_username_account_id @maramalshen

### Changed

- [adjust_inventory.ts] handle 0 stock

### Fixed

- fix bug, get data from repzo with query per_page = 50000 @maramalshen
- [adjust_inventory.ts] fix bug: get measureunit from the variant.product.sv_measureUnit @maramalshen
- [create_payment] fix bug in getting qoyod_payment_account_id @maramalshen
- [commands/basic] fix bug in body: should be object instead of string & inject full logs @maramalshen
- [join] if repzo.joinActionsWebHook.status = failure then commandLog.setStatus should be fail @maramalshen
- [adjust-inventory] fix bug in duplicated variants @maramalshen

### Removed

## [unreleased (date)](path)
