# Backend Abstraction

This document describes how the Flutter app talks to the FastAPI backend without coupling feature code to transport details.

## Repository Pattern
- **Domain-Driven:** Business logic interacts only with repositories, not with backend-specific code.
- **Testability:** Repositories can be mocked for unit testing.
- **FastAPI-Aligned:** Repository implementations target FastAPI contracts and keep feature code stable.

## Integration Layer
- **FastAPI Repositories:** Repositories implement the app-facing interfaces and call FastAPI endpoints.
- **Dependency Injection:** Repositories and service clients are injected at runtime, supporting environment-based configuration.
- **Optional Service Clients:** Narrow integrations such as push delivery can live behind small isolated clients when needed.
- **Sync Boundaries:** The FastAPI layer owns token refresh, error normalization, retry boundaries, and offline queue sync behavior for the Flutter app.

## Example
```
abstract class AuthRepository { ... }

class FastApiAuthRepository implements AuthRepository { ... }
```

## Why This Matters
- **Single Backend Contract:** The app stays aligned to one backend model instead of a generic swapper.
- **Maintainable:** Clear separation of concerns and minimal code duplication.
- **Enterprise-Ready:** Supports scaling, testing, and integration with the FastAPI backend.
- **Safe Sync Model:** Local state can queue safety actions and reconcile with backend truth after reconnect.

---

**Next:** See [migration-mapping.md](migration-mapping.md) for mapping Expo features to Flutter.