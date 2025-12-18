# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Modular backend architecture with `utils/logger` and `middleware/errorHandler`.
- Swagger API documentation at `/api-docs`.
- GitHub Actions CI workflow for automated testing.
- Input validation middleware setup.
- Centralized database seeding logic in `utils/seeder.js`.

### Changed
- Refactored `server.js` to use modular components and improve readability.
- Replaced `console.log` with Winston logger for better production logging.
- Enhanced error handling with standardized JSON responses.

### Fixed
- Fixed `AppVersion` reference error in previous deployment.
