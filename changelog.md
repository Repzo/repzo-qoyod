# Release Notes

## [v1.0.0 (2022-04-18)](https://github.com/Repzo/repzo-qoyod.git)

### Added

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

### Changed

### Fixed

- fix bug, get data from repzo with query per_page = 50000 @maramalshen
- [adjust_inventory.ts] fix bug: get measureunit from the variant.product.sv_measureUnit @maramalshen

### Removed

## [unreleased (date)](path)
