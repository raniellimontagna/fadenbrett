# Changelog

## [1.2.0](https://github.com/raniellimontagna/fadenbrett/compare/v1.1.0...v1.2.0) (2026-03-08)


### Features

* adds board duplication and edge reconnection ([7bea4c0](https://github.com/raniellimontagna/fadenbrett/commit/7bea4c05962c7844c2ce55e89f1eaee44578ac47))


### Bug Fixes

* standardizes upload endpoint path ([7b2ba19](https://github.com/raniellimontagna/fadenbrett/commit/7b2ba19a4f373d57df3573704249575ae80e94d7))

## [1.1.0](https://github.com/raniellimontagna/fadenbrett/compare/v1.0.0...v1.1.0) (2026-03-08)


### Features

* enhances export, increases limits, and improves ui responsiveness ([6b20893](https://github.com/raniellimontagna/fadenbrett/commit/6b20893ea4d6e4061b662d95bdc58987d1f73b84))
* S040 layer ordering (bring to front/send to back) and S041 virtual rulers ([8d2871e](https://github.com/raniellimontagna/fadenbrett/commit/8d2871e54201f65f6325c5158fd4aa8c042c6fa0))
* s040 s041 layer order rulers ([5093d92](https://github.com/raniellimontagna/fadenbrett/commit/5093d924ec753b1196dc4b4710c05c889d10e2ca))

## 1.0.0 (2026-03-08)


### Features

* fadenbrett v2 ([9d5cb2a](https://github.com/raniellimontagna/fadenbrett/commit/9d5cb2ab62654e71252c9b634d952b1766856979))
* S030 - SEO e meta tags do index.html ([8cfdafc](https://github.com/raniellimontagna/fadenbrett/commit/8cfdafcad0797818290a8507dc60c066afbd7f80))
* S031 - Substituir emojis por icones SVG na UI ([6c2654d](https://github.com/raniellimontagna/fadenbrett/commit/6c2654dbc5be0c48b2d32b7dd7bdb10f24ce5f6e))
* S032 - Fix: conflito de double-click (criar card + editar card) ([636d9e9](https://github.com/raniellimontagna/fadenbrett/commit/636d9e9f84b87ae4afc16a2e8fc101efb105868c))
* S033 - Fix: badge 'Salvo HH:MM' sobrepondo controles do canvas ([3dcdb0c](https://github.com/raniellimontagna/fadenbrett/commit/3dcdb0cb29904e8c282fe0edaf568bbdae5a2dd2))
* S034 - Fix: apresentacao mostra 'Card sem titulo' em vez do titulo real ([305bf81](https://github.com/raniellimontagna/fadenbrett/commit/305bf81f4a421c5db0314ab0100a37b0b78ccbd0))
* S035 - Conexoes v2: tipo de rota, curvatura ajustavel e handle arrastavel ([86ce98f](https://github.com/raniellimontagna/fadenbrett/commit/86ce98f7455efbe78573056c9842a14f2efe37dd))
* S036 - Copy/Paste de nodes no canvas ([ae9d800](https://github.com/raniellimontagna/fadenbrett/commit/ae9d800008f95385d91ced0e3dd42fbfe795cf5f))
* S037 - Overlay de ajuda com atalhos de teclado ([5c73778](https://github.com/raniellimontagna/fadenbrett/commit/5c7377873c0ca97fbfb872139ffc8fdafedec1c9))
* S038 S039 - Board personalization and Connection direction arrows ([3038483](https://github.com/raniellimontagna/fadenbrett/commit/30384838e4477fb45c3ea7f62cb4f26ae9023bfc))


### Bug Fixes

* .npmrc allows better-sqlite3 build in Docker; fix CT_HOSTNAME collision; web depends_on service_started ([be36960](https://github.com/raniellimontagna/fadenbrett/commit/be369600a42dd736e715c923b300860402d0136c))
* don't send 'board-default' as UUID when creating initial board ([c88aaae](https://github.com/raniellimontagna/fadenbrett/commit/c88aaae8b972a15e9ff351e505d7847cdbd92a87))
* pretest rebuild better-sqlite3 native bindings for CI ([f2ffd21](https://github.com/raniellimontagna/fadenbrett/commit/f2ffd21180fc8958a4b2c1b667d8bbc14de1dc4e))
* **proxmox:** build from source instead of pulling nonexistent GHCR images ([3867f6c](https://github.com/raniellimontagna/fadenbrett/commit/3867f6c5af960284b736e0714ad29dc5ba861732))
* replace crypto.randomUUID() with fallback for HTTP (non-secure) contexts ([2bb1cbd](https://github.com/raniellimontagna/fadenbrett/commit/2bb1cbd2cb2fa41c1a52ac5c1ca5700dd9cca90b))
* upgrade better-sqlite3 to v11 (Node 22 prebuilt) + approve pnpm build scripts ([ece2310](https://github.com/raniellimontagna/fadenbrett/commit/ece231099eaf586fc5ec5093b382a46a437ea392))
