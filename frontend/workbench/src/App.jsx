const contractRoutes = [
  {
    name: '/api/health',
    note: '只读健康检查'
  },
  {
    name: '/api/summary',
    note: 'Workbench 总览 contract'
  },
  {
    name: '/api/readiness',
    note: '本地环境 readiness contract'
  },
  {
    name: '/api/runs?filter=<filter>',
    note: '后续运行列表 contract'
  },
  {
    name: '/api/runs/latest',
    note: '后续最新运行摘要 contract'
  },
  {
    name: '/api/runs/<run-id>/timeline',
    note: '后续时间线 contract'
  },
  {
    name: '/api/runs/<run-id>/artifacts/<kind>',
    note: '后续产物 contract，缺失字段等待 API 补充'
  },
  {
    name: '/api/adoptions/<adoption-id>/inspect',
    note: '后续采纳检查 contract'
  }
];

const placeholders = [
  {
    title: 'Summary',
    body: '当前仅展示壳层状态；Stage、风险和下一步动作等待后续只读 API 绑定。'
  },
  {
    title: 'Readiness',
    body: '本区域只预留环境状态位置，不读取本地文件，不触发后端动作。'
  },
  {
    title: 'Runs',
    body: '运行历史暂未接入；筛选、详情和时间线留给后续 contract 层实现。'
  },
  {
    title: 'Artifacts',
    body: '产物预览暂未实现；uri/ref、mime、safeToRenderInline 等字段等待 API contract 补充。'
  },
  {
    title: 'Adoption',
    body: '采纳检查 UI 暂未实现；dirty adoption 仍由 pending adoption 与 Git readiness 派生。'
  }
];

const deferredGaps = [
  'artifact preview 缺 uri/ref、mime、title/displayTitle、safeToRenderInline',
  'artifact preview 缺 sourceRunId、artifactKind、previewAvailable、sizeBytes',
  '暂无 shared top-level capabilities object',
  'error envelopes 仍是 route-local',
  'dirty adoption 仍由 pending adoption + dirty Git readiness 派生'
];

export default function App() {
  return (
    <main className="workbench-shell" aria-labelledby="workbench-title">
      <section className="hero-band">
        <div className="hero-content">
          <p className="eyebrow">v15 React/Vite Workbench Shell</p>
          <h1 id="workbench-title">v15 Workbench</h1>
          <p className="hero-copy">
            当前是只读、低密度、copy-only 的最小壳层，用于验证 React/Vite 构建链路。
            本页面不接入写入能力，不改变后端 kernel，也不替代 Stage Charter HTML。
          </p>
          <div className="status-strip" aria-label="当前边界">
            <span>只读展示</span>
            <span>无浏览器执行控件</span>
            <span>静态 shell</span>
          </div>
        </div>
      </section>

      <section className="content-band" aria-labelledby="scope-title">
        <div className="section-heading">
          <p className="section-kicker">Task 4 边界</p>
          <h2 id="scope-title">当前只证明壳层成立</h2>
        </div>
        <div className="boundary-grid">
          <article>
            <h3>已包含</h3>
            <p>React entry、Vite build config、静态 Workbench 外壳和后续 API contract 列表。</p>
          </article>
          <article>
            <h3>未包含</h3>
            <p>完整 Workbench UI、artifact preview、adoption inspect、真实 Stage overview 数据绑定。</p>
          </article>
          <article>
            <h3>安全提示</h3>
            <p>禁止能力只作为纯文本边界说明存在；页面没有按钮、链接、表单、菜单或浏览器动作入口。</p>
          </article>
        </div>
      </section>

      <section className="content-band muted-band" aria-labelledby="contracts-title">
        <div className="section-heading">
          <p className="section-kicker">后续只读 API</p>
          <h2 id="contracts-title">等待绑定的 contract</h2>
        </div>
        <dl className="contract-list">
          {contractRoutes.map((route) => (
            <div className="contract-row" key={route.name}>
              <dt>{route.name}</dt>
              <dd>{route.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="content-band" aria-labelledby="placeholder-title">
        <div className="section-heading">
          <p className="section-kicker">静态占位</p>
          <h2 id="placeholder-title">后续视图入口</h2>
        </div>
        <div className="placeholder-grid">
          {placeholders.map((item) => (
            <article className="placeholder-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band muted-band" aria-labelledby="gaps-title">
        <div className="section-heading">
          <p className="section-kicker">Contract gaps</p>
          <h2 id="gaps-title">不由 React 端推断</h2>
        </div>
        <ul className="gap-list">
          {deferredGaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
