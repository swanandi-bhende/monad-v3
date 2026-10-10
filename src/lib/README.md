# Library

Infrastructure code with no React rendering.

- `env.ts`: validates `NEXT_PUBLIC_*` environment variables. Import `env` instead of reading `process.env` directly.
- `wagmi.ts`: the wagmi config (chain, connectors, transports).
- Contract clients and ABI wiring will also live here.
