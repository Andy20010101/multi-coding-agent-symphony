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
  const routeCounts = routeStateCounts(model?.routeStates ?? []);

  return (
    <main className="workbench-shell" aria-labelledby="workbench-title">
      <header className="workbench-header">
        <div className="header-copy">
          <p className="eyebrow">v15 React/Vite Workbench</p>
          <h1 id="workbench-title">v15 Workbench</h1>
          <p className="header-summary">
            基于 Task 5 / Task 6 的只读 API binding 展示 summary、readiness、runs、latest run、
            timeline、artifact refs 与 adoption summary。浏览器端只读取受控 GET routes，
            不提供写入、终端动作或 artifact inline preview。
          </p>
        </div>
        <div className="status-strip" aria-label="当前只读状态">
          <span>{phaseText(viewState.phase)}</span>
          <span>{routeCounts.ready}/{routeCounts.total} routes 已读取</span>
          <span>刷新页面后会重新读取只读 API</span>
        </div>
      </header>

      {viewState.phase === 'loading' ? <ShellState title="读取中" copy="正在读取 summary、readiness、runs 与 latest run 只读 contract。" /> : null}
      {viewState.phase === 'failed' ? <ShellState title="读取失败" copy="错误摘要：只读 contract 未暴露或不可用。刷新页面后会重新读取只读 API。" /> : null}

      {model === null ? null : (
        <>
          <section className="panel-grid" aria-label="Workbench 只读 panels">
            <SummaryPanel summary={model.summary} route={findRoute(model.routeStates, 'summary')} />
            <ReadinessPanel readiness={model.readiness} route={findRoute(model.routeStates, 'readiness')} />
            <RunsPanel runs={model.runs} route={findRoute(model.routeStates, 'runs')} />
            <LatestRunPanel latestRun={model.latestRun} route={findRoute(model.routeStates, 'latestRun')} />
          </section>

          <section className="detail-grid" aria-label="Task 7 只读扩展 panels">
            <TimelinePanel timeline={model.latestRunTimeline} route={findRoute(model.routeStates, 'latestRunTimeline')} />
            <ArtifactListPanel artifactRefs={model.artifactRefs} />
            <AdoptionSummaryPanel adoption={model.adoption} />
          </section>

          <section className="support-grid" aria-label="只读 contract 支撑信息">
            <RoutePanel routes={model.routeStates} />
            <ContractGapPanel gaps={model.deferredGaps} />
          </section>
        </>
      )}
    </main>
  );
}

function SummaryPanel({ summary, route }) {
  return (
    <DataPanel
      id="summary-panel"
      kicker="Summary panel"
      title="Summary 只读摘要"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', summary.contractName],
        ['contractVersion', summary.contractVersion],
        ['status', summary.status],
        ['generatedAt', summary.generatedAt],
        ['readOnly', summary.readOnly],
        ['modelInvocation', summary.modelInvocation],
        ['capabilities', summary.capabilities],
        ['overview.status', summary.overviewStatus],
        ['stageSummary.stageId', summary.stageId],
        ['stageSummary.status', summary.stageStatus],
        ['runStats.total', summary.runCount]
      ]} />

      <Subsection title="latestRun 简要信息">
        <FieldList rows={[
          ['runId', summary.latestRun.runId],
          ['status', summary.latestRun.status],
          ['verifierStatus', summary.latestRun.verifierStatus],
          ['updatedAt', summary.latestRun.updatedAt]
        ]} />
      </Subsection>

      <Subsection title="adoptionSummary">
        <FieldList rows={[
          ['status', summary.adoptionSummary.status],
          ['pendingCount', summary.adoptionSummary.pendingCount],
          ['dirtyBlocked', summary.adoptionSummary.dirtyBlocked]
        ]} />
      </Subsection>

      <p className="panel-note">{summary.readonlyNote}</p>
    </DataPanel>
  );
}

function ReadinessPanel({ readiness, route }) {
  return (
    <DataPanel
      id="readiness-panel"
      kicker="Readiness panel"
      title="Readiness 只读诊断"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', readiness.contractName],
        ['contractVersion', readiness.contractVersion],
        ['status', readiness.status],
        ['readOnly', readiness.readOnly],
        ['modelInvocation', readiness.modelInvocation],
        ['capabilities', readiness.capabilities],
        ['tools.git.dirty', readiness.gitDirty],
        ['tools.git.dirtyFilesCount', readiness.dirtyFilesCount],
        ['tools.packageManager.status', readiness.packageManagerStatus]
      ]} />

      <Subsection title="checks">
        <CheckList checks={readiness.checks} />
      </Subsection>

      <Subsection title="diagnostics / attention items">
        <RiskList riskSummary={readiness.diagnostics} />
      </Subsection>

      <Subsection title="Stage 与 artifact 状态">
        <FieldList rows={[
          ['stage status', readiness.signals.stageStatus],
          ['blocked Stage', readiness.signals.stageBlockerStatus],
          ['blocker title', readiness.signals.stageBlockerTitle],
          ['Charter consistency', readiness.signals.charterConsistencyStatus],
          ['artifact status', readiness.signals.artifactStatus],
          ['missing artifact count', readiness.signals.missingArtifactCount]
        ]} />
      </Subsection>

      <p className="panel-note">{readiness.signals.note}</p>
      <p className="panel-note">{readiness.readonlyNote}</p>
    </DataPanel>
  );
}

function RunsPanel({ runs, route }) {
  return (
    <DataPanel
      id="runs-panel"
      kicker="Runs panel"
      title="Runs 只读列表"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', runs.contractName],
        ['contractVersion', runs.contractVersion],
        ['filter', runs.filter],
        ['route count', runs.count],
        ['summary count', runs.summaryCount],
        ['availableFilters', textValue(runs.availableFilters.join('、') || '未暴露')]
      ]} />

      {runs.state === 'missing' ? <EmptyBlock copy="runs list 未暴露或不可用。" /> : null}
      {runs.state === 'empty' ? <EmptyBlock copy="当前没有运行记录。" /> : null}
      {runs.state === 'available' ? <RunList runs={runs.items} /> : null}

      <p className="panel-note">Runs panel 只展示本地只读列表；latest 标识来自 summary/latestRun 已暴露 id，对浏览器端没有写入含义。</p>
    </DataPanel>
  );
}

function LatestRunPanel({ latestRun, route }) {
  return (
    <DataPanel
      id="latest-run-panel"
      kicker="Latest run panel"
      title="Latest run 只读详情"
      state={latestRunStateText(latestRun, route)}
      route={route}
    >
      {latestRun.state === 'unavailable' ? <EmptyBlock copy={`错误摘要：${latestRun.error}`} /> : null}
      {latestRun.state === 'empty' ? <EmptyBlock copy="当前没有 latest run；artifactRefs 与 timeline 不适用。" /> : null}

      <FieldList rows={[
        ['runId', latestRun.runId],
        ['status', latestRun.status],
        ['verifierStatus', latestRun.verifierStatus],
        ['modelInvocation', latestRun.modelInvocation],
        ['executionPlanId', latestRun.executionPlanId],
        ['adoptionPlanId', latestRun.adoptionPlanId],
        ['createdAt', latestRun.createdAt],
        ['updatedAt', latestRun.updatedAt],
        ['artifactRefs count', latestRun.artifactRefsCount],
        ['timeline', textValue(latestRun.timeline.text)]
      ]} />

      <Subsection title="artifactRefs 只读列表">
        <ArtifactRefList artifactRefs={latestRun.artifactRefs} />
      </Subsection>

      <p className="panel-note">Latest run panel 不读取 artifact 文件内容，也不根据 kind、路径、扩展名或内容决定 inline preview。</p>
    </DataPanel>
  );
}

function TimelinePanel({ timeline, route }) {
  return (
    <DataPanel
      id="timeline-panel"
      kicker="Timeline panel"
      title="Latest run timeline"
      state={timelineStateText(timeline, route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', timeline.contractName],
        ['contractVersion', timeline.contractVersion],
        ['runId', timeline.runId],
        ['event count', timeline.count]
      ]} />

      <Subsection title="timeline entries">
        <TimelineList timeline={timeline} />
      </Subsection>

      <p className="panel-note">{timeline.note}</p>
    </DataPanel>
  );
}

function ArtifactListPanel({ artifactRefs }) {
  return (
    <DataPanel
      id="artifact-list-panel"
      kicker="Artifact refs/list panel"
      title="Artifact refs 只读列表"
      state={artifactRefs.state === 'missing' ? '未暴露' : '只读'}
    >
      <FieldList rows={[
        ['registered refs', textValue(artifactRefs.label)],
        ['artifactStatus.status', artifactRefs.status.status],
        ['artifactStatus.total', artifactRefs.status.total],
        ['artifactStatus.available', artifactRefs.status.available],
        ['artifactStatus.missing', artifactRefs.status.missing],
        ['artifactStatus.unknown', artifactRefs.status.unknown],
        ['missingKinds', artifactRefs.status.missingKinds],
        ['unregistered kind route', artifactRefs.unregistered]
      ]} />

      <Subsection title="artifact refs/list">
        <ArtifactRefList artifactRefs={artifactRefs} />
      </Subsection>

      <p className="panel-note">Artifact panel 只展示 latest run 已暴露 refs 与状态；不读取本地文件，不拼接 /@fs/ URL，不调用 artifact preview route。</p>
    </DataPanel>
  );
}

function AdoptionSummaryPanel({ adoption }) {
  return (
    <DataPanel
      id="adoption-summary-panel"
      kicker="Adoption summary panel"
      title="Adoption summary 只读状态"
      state="只读"
    >
      <FieldList rows={[
        ['status', adoption.status],
        ['pendingCount', adoption.pendingCount],
        ['dirtyBlocked', adoption.dirtyBlocked],
        ['Git dirty readiness', adoption.gitDirtyReadiness]
      ]} />

      <p className="panel-note">{adoption.note}</p>
    </DataPanel>
  );
}

function RoutePanel({ routes }) {
  return (
    <DataPanel
      id="routes-panel"
      kicker="API contract 使用范围"
      title="固定 GET routes"
      state="只读"
    >
      <dl className="route-list">
        {routes.map((route) => (
          <div className="route-row" key={route.id}>
            <dt>{route.method} {route.path}</dt>
            <dd>
              <span className={`state-pill ${route.state}`}>{routeStateText(route)}</span>
              <span>{route.contractName.text}</span>
              <span>version {route.contractVersion.text}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="panel-note">API client 只绑定 /api/summary、/api/readiness、/api/runs、/api/runs/latest 与 latest run id 派生的 timeline GET route。</p>
    </DataPanel>
  );
}

function ContractGapPanel({ gaps }) {
  return (
    <DataPanel
      id="contract-gap-panel"
      kicker="Contract gaps"
      title="等待 API contract 补充"
      state="不由前端推断"
    >
      <ul className="gap-list">
        {gaps.map((gap) => (
          <li key={gap.label}>
            <span>{gap.label}</span>
            <strong>{gap.status}</strong>
          </li>
        ))}
      </ul>
      <p className="panel-note">这些 gap 继续作为 API contract 问题处理；React 端不会伪造字段。</p>
    </DataPanel>
  );
}

function DataPanel({ id, kicker, title, state, route, children }) {
  return (
    <article className="data-panel" aria-labelledby={`${id}-title`}>
      <header className="panel-header">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <span className="panel-state">{state}</span>
      </header>
      {route?.state === 'failed' ? (
        <p className="error-copy">错误摘要：{route.error}。刷新页面后会重新读取只读 API。</p>
      ) : null}
      {children}
    </article>
  );
}

function Subsection({ title, children }) {
  return (
    <section className="panel-subsection" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function FieldList({ rows }) {
  return (
    <dl className="field-list">
      {rows.map(([label, state]) => (
        <div className="field-row" key={label}>
          <dt>{label}</dt>
          <dd className={state?.state === 'missing' ? 'missing-value' : ''}>{formatState(state)}</dd>
        </div>
      ))}
    </dl>
  );
}

function CheckList({ checks }) {
  if (checks.state === 'missing') {
    return <EmptyBlock copy="checks 未暴露。" />;
  }

  if (checks.items.length === 0) {
    return <EmptyBlock copy="checks 为空。" />;
  }

  return (
    <ul className="compact-list">
      {checks.items.map((check) => (
        <li key={check.id.text}>
          <strong>{check.label.text}</strong>
          <span>{check.status.text}</span>
          <span>{check.detail.text}</span>
        </li>
      ))}
    </ul>
  );
}

function RiskList({ riskSummary }) {
  if (riskSummary.state === 'missing') {
    return <EmptyBlock copy="riskSummary 未暴露。" />;
  }

  if (riskSummary.items.length === 0) {
    return <EmptyBlock copy="没有已暴露的 attention items。" />;
  }

  return (
    <ul className="compact-list">
      {riskSummary.items.map((risk) => (
        <li key={`${risk.id.text}-${risk.title.text}`}>
          <strong>{risk.title.text}</strong>
          <span>{risk.severity.text}</span>
          <span>{risk.category.text}</span>
          <span>{risk.detail.text}</span>
        </li>
      ))}
    </ul>
  );
}

function TimelineList({ timeline }) {
  if (timeline.state === 'unavailable') {
    return <EmptyBlock copy={`timeline 不可用：${timeline.error}`} />;
  }

  if (timeline.state === 'missing') {
    return <EmptyBlock copy="timeline 未暴露。" />;
  }

  if (timeline.items.length === 0) {
    return <EmptyBlock copy="暂无 timeline。" />;
  }

  return (
    <ul className="timeline-list">
      {timeline.items.map((event, index) => (
        <li key={`${event.id.text}-${index}`}>
          <FieldList rows={[
            ['id', event.id],
            ['label', event.label],
            ['status', event.status],
            ['detail', event.detail],
            ['at', event.at]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function RunList({ runs }) {
  return (
    <div className="run-list">
      {runs.map((run) => (
        <article className="run-row" key={run.runId.text}>
          <div className="run-row-header">
            <h3>{run.runId.text}</h3>
            <span className="state-pill">{run.isLatest.value === true ? 'latest' : 'history'}</span>
          </div>
          <FieldList rows={[
            ['status', run.status],
            ['verifierStatus', run.verifierStatus],
            ['intent', run.intent],
            ['command', run.command],
            ['semanticCommand', run.semanticCommand],
            ['route key', run.routeKey],
            ['route intent', run.routeDecisionIntent],
            ['route reason', run.routeDecisionReason],
            ['createdAt', run.createdAt],
            ['updatedAt', run.updatedAt],
            ['artifactRefs', textValue(run.artifactRefs.label)]
          ]} />
        </article>
      ))}
    </div>
  );
}

function ArtifactRefList({ artifactRefs }) {
  if (artifactRefs.state === 'missing') {
    return <EmptyBlock copy="artifactRefs 未暴露或不可用。" />;
  }

  if (artifactRefs.items.length === 0) {
    return <EmptyBlock copy="artifactRefs 为空。" />;
  }

  return (
    <ul className="artifact-list">
      {artifactRefs.items.map((artifact, index) => (
        <li key={`${artifact.kind.text}-${index}`}>
          <FieldList rows={[
            ['kind', artifact.kind],
            ['status', artifact.status],
            ['path', artifact.path],
            ['ref', artifact.ref],
            ['preview fields', textValue(artifact.previewFields.map((field) => `${field.label}:${field.text}`).join(' / '))]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function ShellState({ title, copy }) {
  return (
    <section className="shell-state" aria-label={title}>
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

function EmptyBlock({ copy }) {
  return <p className="empty-copy">{copy}</p>;
}

function findRoute(routes, id) {
  return routes.find((route) => route.id === id) ?? null;
}

function routeStateCounts(routes) {
  return {
    total: routes.length,
    ready: routes.filter((route) => route.state === 'ready').length
  };
}

function routeStateText(route) {
  if (route === null || route === undefined) {
    return '等待读取';
  }

  if (route.state === 'ready') {
    return '已读取';
  }

  if (route.state === 'skipped') {
    return '不适用';
  }

  return '不可用';
}

function latestRunStateText(latestRun, route) {
  if (latestRun.state === 'empty') {
    return '无运行记录';
  }

  if (latestRun.state === 'unavailable') {
    return '不可用';
  }

  return routeStateText(route);
}

function timelineStateText(timeline, route) {
  if (timeline.state === 'empty') {
    return '暂无 timeline';
  }

  if (timeline.state === 'missing') {
    return '未暴露';
  }

  if (timeline.state === 'unavailable') {
    return '不可用';
  }

  return routeStateText(route);
}

function phaseText(phase) {
  if (phase === 'loading') {
    return '读取中';
  }

  if (phase === 'failed') {
    return '读取失败';
  }

  return '只读展示';
}

function textValue(text) {
  return {
    state: text === '未暴露' || text === '' ? 'missing' : 'available',
    text,
    value: text
  };
}

function formatState(state) {
  if (state === null || state === undefined) {
    return '未暴露';
  }

  return state.text ?? String(state.value ?? '未暴露');
}
