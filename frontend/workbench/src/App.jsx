import { useEffect, useState } from 'react';

import { fetchWorkbenchContracts } from './api/client.js';

const initialState = {
  phase: 'loading',
  model: null
};

export default function App() {
  const [viewState, setViewState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;

    fetchWorkbenchContracts().then((model) => {
      if (!cancelled) {
        setViewState({
          phase: 'ready',
          model
        });
      }
    }).catch(() => {
      if (!cancelled) {
        setViewState({
          phase: 'failed',
          model: null
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const model = viewState.model;

  return (
    <main className="workbench-shell" aria-labelledby="workbench-title">
      <section className="hero-band">
        <div className="hero-content">
          <p className="eyebrow">v15 React/Vite Workbench</p>
          <h1 id="workbench-title">v15 Workbench</h1>
          <p className="hero-copy">
            当前绑定 Task 1 冻结的只读 API contract，只展示低密度状态。
            本页面不提供浏览器动作入口，不改变后端 kernel，也不替代 Stage Charter HTML。
          </p>
          <div className="status-strip" aria-label="当前边界">
            <span>只读展示</span>
            <span>无浏览器执行控件</span>
            <span>{viewState.phase === 'loading' ? '读取中' : 'GET API 绑定'}</span>
          </div>
        </div>
      </section>

      <section className="content-band" aria-labelledby="status-title">
        <div className="section-heading">
          <p className="section-kicker">Task 5 状态</p>
          <h2 id="status-title">只读 API 读取结果</h2>
        </div>
        {viewState.phase === 'loading' ? <LoadingState /> : null}
        {viewState.phase === 'failed' ? <ReadFailure /> : null}
        {model === null ? null : <StatusCards model={model} />}
      </section>

      <section className="content-band muted-band" aria-labelledby="contracts-title">
        <div className="section-heading">
          <p className="section-kicker">只读 routes</p>
          <h2 id="contracts-title">已绑定的 API contract</h2>
        </div>
        {model === null ? <p className="empty-copy">等待 API contract 暴露。</p> : <RouteList routes={model.routeStates} />}
      </section>

      <section className="content-band" aria-labelledby="placeholder-title">
        <div className="section-heading">
          <p className="section-kicker">Projection</p>
          <h2 id="placeholder-title">contract binding 摘要</h2>
        </div>
        {model === null ? <p className="empty-copy">读取成功后展示 summary、readiness、runs 与 latest run 投影。</p> : <ProjectionSummary model={model} />}
      </section>

      <section className="content-band muted-band" aria-labelledby="gaps-title">
        <div className="section-heading">
          <p className="section-kicker">Contract gaps</p>
          <h2 id="gaps-title">不由 React 端推断</h2>
        </div>
        <ul className="gap-list">
          {(model?.deferredGaps ?? []).map((gap) => (
            <li key={gap.label}>{gap.label}：{gap.status}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function LoadingState() {
  return <p className="empty-copy">正在读取只读 API contract。</p>;
}

function ReadFailure() {
  return <p className="empty-copy">读取失败 / contract 未暴露 / 不可用。</p>;
}

function StatusCards({ model }) {
  const cards = [
    {
      title: 'Summary',
      value: model.summary.overviewStatus.text,
      detail: model.summary.headline.text
    },
    {
      title: 'Readiness',
      value: model.readiness.status.text,
      detail: `readOnly=${model.readiness.readOnly.text} / modelInvocation=${model.readiness.modelInvocation.text}`
    },
    {
      title: 'Latest Run',
      value: model.latestRun.status.text,
      detail: model.latestRun.state === 'empty'
        ? '无运行记录'
        : `runId=${model.latestRun.runId.text} / verifier=${model.latestRun.verifierStatus.text}`
    },
    {
      title: 'Runs Count',
      value: model.runs.summaryCount.text,
      detail: `route count=${model.runs.count.text}`
    }
  ];

  return (
    <div className="status-grid">
      {cards.map((card) => (
        <article className="status-card" key={card.title}>
          <h3>{card.title}</h3>
          <p className="metric-value">{card.value}</p>
          <p>{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

function RouteList({ routes }) {
  return (
    <dl className="contract-list">
      {routes.map((route) => (
        <div className="contract-row" key={route.id}>
          <dt>{route.method} {route.path}</dt>
          <dd>
            <span className={`state-pill ${route.state}`}>{route.state === 'ready' ? '已读取' : '不可用'}</span>
            <span>{route.contractName.text}</span>
            <span>version {route.contractVersion.text}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectionSummary({ model }) {
  const artifactKinds = model.artifactRefs.items
    .map((artifact) => artifact.kind.text)
    .slice(0, 4)
    .join('、');

  return (
    <div className="projection-grid">
      <article>
        <h3>只读能力</h3>
        <p>summary capabilities：{model.summary.capabilities.text}</p>
        <p>readiness capabilities：{model.readiness.capabilities.text}</p>
      </article>
      <article>
        <h3>采纳状态</h3>
        <p>pending：{model.adoption.pendingCount.text}</p>
        <p>dirtyBlocked：{model.adoption.dirtyBlocked.text}</p>
        <p>Git dirty：{model.adoption.gitDirtyReadiness.text}</p>
      </article>
      <article>
        <h3>产物引用</h3>
        <p>artifactRefs：{model.artifactRefs.label}</p>
        <p>{artifactKinds || '未暴露'}</p>
        <p>preview 字段缺口：{model.artifactRefs.missingPreviewFields.join('、') || '无'}</p>
      </article>
    </div>
  );
}
