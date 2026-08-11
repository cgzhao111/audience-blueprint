# Audience Blueprint

Audience Blueprint 是一个面向 Dify 与 CDP 团队的“证据约束型营销人群配置顾问”开源工具。它把营销需求转换为可人工复核的人群规则，同时拒绝使用标签目录中不存在的字段。

项目包含：

- 可导入的 Dify Chatflow；
- 标签、属性、行为的统一目录契约；
- 零依赖 Node.js CLI，支持校验 JSON/CSV 目录并生成 Dify 知识文档；
- 完全虚构的零售演示策略和标签；
- 工作流结构、Python Code、目录完整性及脱敏检查。

> 当前版本：`v0.1.1` 已公开发布。仓库内所有业务数据均为合成示例。工作流不计算人数、不自动建群、不执行触达。

## 解决什么问题

营销人员通常知道活动目标，却不知道 CDP 中准确的字段名称、路径、操作符、枚举值和排除逻辑。如果让大模型补齐这些信息，很容易得到“看起来合理、实际上无法配置”的规则。

Audience Blueprint 将能力拆成三层：

1. 策略知识库负责解释如何划分人群；
2. 标签目录知识库负责声明真实存在的能力；
3. Dify 内置 Code 节点对两者取交集，并输出三种状态：
   - `CONFIRMED_CONFIGURABLE`：已确认可配置；
   - `NEEDS_CONFIRMATION`：配置前请确认；
   - `UNSUPPORTED`：当前目录不支持。

## 快速开始

需要 Node.js 20+；运行内嵌工作流核心 Demo 还需要 Python 3。只有使用 Chatflow 对话界面时才需要 Dify 工作区。

```bash
npm install
npm run check
npm run demo
node ./bin/audience-blueprint.js validate ./examples/retail-demo/catalog.json
node ./bin/audience-blueprint.js build ./examples/retail-demo/catalog.json --out ./knowledge/tags --force
```

CLI 同时支持 CSV，数组字段使用 `|` 分隔。示例见 [`examples/retail-demo/catalog.csv`](examples/retail-demo/catalog.csv)。

JSON 目录可以通过顶层 `source_data_type` 声明数据类型（演示值为 `synthetic_demo`）；CSV 可按行声明。未提供时，生成文档使用中性的 `catalog_metadata`。CLI 只记录输入文件名，不会把本机绝对路径写进知识文档。

## 在 Dify 中运行

1. 新建策略知识库，上传 [`knowledge/strategy`](knowledge/strategy) 中的6份文件。
2. 新建标签目录知识库，上传 [`knowledge/tags`](knowledge/tags) 中生成的文档。
3. 导入 [`workflow/audience-blueprint-chatflow.yml`](workflow/audience-blueprint-chatflow.yml)。
4. 给两个空的知识检索节点绑定对应知识库。
5. 选择当前工作区可用的模型。模板引用 Dify 的 OpenAI Provider，导入后可以替换为组织允许的模型。
6. 使用 [`evals/golden-cases.md`](evals/golden-cases.md) 完成验证。

详细说明见 [`docs/DIFY_SETUP.md`](docs/DIFY_SETUP.md)。

## 可复现的本地 Demo

`npm run demo` 会执行 Chatflow 内同一套策略选择与目录校验 Python，不调用大模型，也不连接 CDP。内置的购物车挽回案例必须以6个有证据约束的条件达到 `CONFIRMED_CONFIGURABLE`。

当前演示目录包含17条完全合成的记录和5个营销场景，并专门加入：

- 必须保持 `NEEDS_CONFIRMATION` 的潮流敏感度线索；
- 必须报告为能力缺口的门店居住半径概念；
- 使用近期加购、排除同期已购买用户的购物车挽回策略。

实际输出与验证边界见 [`docs/DEMO.md`](docs/DEMO.md)。这只能证明确定性工作流核心已在本地运行，不能据此声称某个 Dify 版本、模型供应商或生产 CDP 已兼容。

## 目录状态

| 状态 | 含义 | 输出行为 |
|---|---|---|
| `CONFIRMED_CONFIGURABLE` | 路径、资源类型、操作符、证据来源和版本完整 | 可展示明确配置步骤，仍需人工复核 |
| `NEEDS_CONFIRMATION` | 存在线索，但元数据或审批不完整 | 展示建议和待确认清单 |
| `UNSUPPORTED` | 当前目录没有该能力 | 只报告缺口，不使用近似字段替代 |

行为类资源还需要时间窗口要求和聚合方式，才能进入确认状态。

## 隐私和安全

- 不要提交会员名单、手机号、邮箱、订单明细或生产数据导出。
- 不要把 API Key、内部地址或模型凭证写入 DSL 和目录文件。
- 公开任何目录元数据前，都要确认拥有公开授权。
- 公开示例应使用合成数据或明确可再分发的数据。
- 工作流只生成供人工审核的配置建议，不是自动营销执行系统。

## 已知限制

- 当前规则为平铺条件，不能保证任意深层 AND/OR 规则树无损转换。
- 知识检索可能漏召回；白名单可以避免编造，但不能保证召回完整。
- 无法实时判断某个 CDP 账号的权限、字段上下线或枚举变化。
- 不同 Dify 版本和模型插件存在差异，导入后可能需要重新选择模型。

## 参与贡献

请阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md) 和 [`SECURITY.md`](SECURITY.md)。欢迎贡献新的目录适配器、确定性规则检查、Dify兼容性测试和其他行业的合成示例。首次参与者可以从 [`docs/CONTRIBUTOR_STARTER_ISSUES.md`](docs/CONTRIBUTOR_STARTER_ISSUES.md) 中已经限定范围的任务开始。

维护者还应阅读 [`docs/MAINTAINER_WORKFLOW.md`](docs/MAINTAINER_WORKFLOW.md) 与 [`docs/PUBLIC_RELEASE_CHECKLIST.md`](docs/PUBLIC_RELEASE_CHECKLIST.md)。两份文档将本地验证、公开发布、Dify 实机兼容和真实采用证据明确分开。

## 许可证

Apache License 2.0，详见 [`LICENSE`](LICENSE)。
