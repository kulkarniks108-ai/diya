# Backend Abstraction

This document describes the backend abstraction strategy for the Flutter app, enabling seamless switching between Firebase, REST APIs, FastAPI, or other backends.

## Repository Pattern
- **Domain-Driven:** Business logic interacts only with repositories, not with backend-specific code.
- **Testability:** Repositories can be mocked for unit testing.
- **Flexibility:** Swap backend implementations without changing business logic.

## Adapter Layer
- **Backend Adapters:** Each backend (Firebase, REST, etc.) has its own adapter implementing repository interfaces.
- **Dependency Injection:** Adapters are injected at runtime, supporting environment-based configuration.
- **Migration Ready:** Enables gradual migration or multi-backend support.

## Example
```
abstract class AuthRepository { ... }

class FirebaseAuthAdapter implements AuthRepository { ... }
class FastApiAuthAdapter implements AuthRepository { ... }
```

## Why This Matters
- **Future-Proof:** Easily adopt new backends or migrate as requirements evolve.
- **Maintainable:** Clear separation of concerns and minimal code duplication.
- **Enterprise-Ready:** Supports scaling, testing, and integration with multiple systems.

---

**Next:** See [migration-mapping.md](migration-mapping.md) for mapping Expo features to Flutter.