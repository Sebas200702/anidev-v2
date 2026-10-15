## ADDED Requirements

### Requirement: Local services start with bounded resources

Every service in the local stack SHALL start with resource limits it can satisfy
on an ordinary developer machine, independent of how many CPU cores the host
reports. A service MUST NOT refuse to boot because a host-derived default demands
more memory than the machine can back.

#### Scenario: Cache service on a many-core host

- **WHEN** a developer starts the local stack on a host with many CPU cores
- **THEN** the cache service starts successfully, because its thread count and
  memory budget are pinned in the stack definition rather than derived from the
  core count

#### Scenario: Application connects to the local cache

- **WHEN** the local stack is up and the application performs a cached read
- **THEN** the cache accepts the connection instead of failing the request with a
  connection error caused by a restarting service

#### Scenario: Local limits do not define production sizing

- **WHEN** the local stack's resource limits are read
- **THEN** they are documented as development-only and carry no implication for
  production capacity planning
