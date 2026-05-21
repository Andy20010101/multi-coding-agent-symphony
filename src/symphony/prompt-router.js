const REAL_GATES = {
  codex: 'MCAS_RUN_REAL_CODEX',
  claude: 'MCAS_RUN_REAL_CLAUDE',
  kiro: 'MCAS_RUN_REAL_KIRO'
};

const INTENT_PIPELINES = {
  'new-project': ['new', 'scan'],
  'scan-project': ['scan'],
  work: ['scan-if-needed', 'do'],
  review: ['scan-if-needed', 'review'],
  verify: ['scan-if-needed', 'verify'],
  continue: ['continue latest'],
  status: ['status'],
  artifacts: ['artifacts']
};

export function classifyPrompt({ prompt, args = [], projectState = {} } = {}) {
  assertNonEmptyString(prompt, 'prompt');

  const safety = classifySafety({ prompt, args });
  const intent = classifyIntent({ prompt, projectState });
  const template = intent.intent === 'new-project' ? inferTemplateFromPrompt(prompt) : undefined;
  const pipeline = INTENT_PIPELINES[intent.intent];
  const safetyMode = safety.safetyMode ?? defaultSafetyMode(intent.intent);
  const adapter = safety.adapter ?? 'codex';

  return {
    version: '1',
    intent: intent.intent,
    confidence: intent.confidence,
    matchedSignals: [...safety.matchedSignals, ...intent.matchedSignals],
    safetyMode,
    adapter,
    pipeline,
    requiresGate: safetyMode === 'external' ? REAL_GATES[adapter] : null,
    requiresConfirmation: safety.requiresConfirmation,
    ...(template ? { template } : {}),
    reason: reasonFor({ intent: intent.intent, safetyMode, projectState })
  };
}

export function inferTemplateFromPrompt(prompt) {
  const normalized = normalize(prompt);

  if (/\b(node|node\.js)\b/u.test(normalized) && /\b(cli|command line|bin)\b/u.test(normalized)) {
    return 'node-cli';
  }

  if (/\b(web|frontend|react|vue|next|vite|html)\b/u.test(normalized) || /前端|网页|看板/u.test(prompt)) {
    return 'web-app';
  }

  return 'empty';
}

function classifySafety({ prompt, args }) {
  const text = normalize(`${prompt} ${args.join(' ')}`);
  const matchedSignals = [];
  let safetyMode;
  let adapter;
  let requiresConfirmation = false;

  if (args.includes('--dry-run') || /\b(dry run|no changes)\b/u.test(text) || /不改文件|只预演/u.test(prompt)) {
    safetyMode = 'dry-run';
    matchedSignals.push('dry-run');
  }

  if (args.includes('--write') || /\b(write files?)\b/u.test(text) || /创建文件|写入文件/u.test(prompt)) {
    safetyMode = 'write';
    matchedSignals.push('write');
  }

  const realIndex = args.indexOf('--real');
  if (realIndex !== -1 && typeof args[realIndex + 1] === 'string') {
    adapter = normalizeAdapter(args[realIndex + 1]);
    safetyMode = 'external';
    matchedSignals.push(`--real ${adapter}`);
  } else if (/\b(codex)\b/u.test(text) && /真实/u.test(prompt)) {
    adapter = 'codex';
    safetyMode = 'external';
    matchedSignals.push('real codex');
  } else if (/\b(claude)\b/u.test(text) && /真实/u.test(prompt)) {
    adapter = 'claude';
    safetyMode = 'external';
    matchedSignals.push('real claude');
  } else if (/\b(kiro)\b/u.test(text) && /真实/u.test(prompt)) {
    adapter = 'kiro';
    safetyMode = 'external';
    matchedSignals.push('real kiro');
  } else if (/真实修复|真实执行/u.test(prompt)) {
    adapter = 'codex';
    safetyMode = 'external';
    matchedSignals.push('real');
  }

  if (/\b(delete|reset|purge|overwrite)\b/u.test(text) || /删除|重置|覆盖/u.test(prompt)) {
    safetyMode = 'destructive';
    requiresConfirmation = !args.includes('--confirm-destructive');
    matchedSignals.push('destructive');
  }

  return {
    safetyMode,
    adapter,
    matchedSignals,
    requiresConfirmation
  };
}

function classifyIntent({ prompt, projectState }) {
  const normalized = normalize(prompt);
  const checks = [
    {
      intent: 'status',
      confidence: 'high',
      signals: ['status', '状态'],
      matches: /\bstatus\b/u.test(normalized) || /状态/u.test(prompt)
    },
    {
      intent: 'artifacts',
      confidence: 'high',
      signals: ['artifacts', 'evidence', '证据', '产物'],
      matches: /\b(artifacts?|evidence)\b/u.test(normalized) || /证据|产物/u.test(prompt)
    },
    {
      intent: 'continue',
      confidence: 'high',
      signals: ['continue', 'resume', '继续', '恢复'],
      matches: /\b(continue|resume)\b/u.test(normalized) || /继续|恢复/u.test(prompt)
    },
    {
      intent: 'new-project',
      confidence: 'high',
      signals: ['create', 'new project', '新建', '创建一个新的'],
      matches: /\b(create|new project|from scratch|scaffold)\b/u.test(normalized)
        || /新建|从头开始|创建一个新的|创建.*项目/u.test(prompt)
        || projectState.emptyDirectory === true
    },
    {
      intent: 'review',
      confidence: 'high',
      signals: ['review', 'audit', '审查', '检查改动'],
      matches: /\b(review|audit|code review)\b/u.test(normalized) || /审查|代码审查|检查改动|当前改动/u.test(prompt)
    },
    {
      intent: 'verify',
      confidence: 'high',
      signals: ['run tests', 'verify', '跑测试', '验证'],
      matches: startsWithVerify(prompt, normalized)
    },
    {
      intent: 'scan-project',
      confidence: 'high',
      signals: ['scan', 'analyze', '扫描', '理解'],
      matches: /\b(scan|analy[sz]e|understand)\b/u.test(normalized) || /扫描|理解|分析项目/u.test(prompt)
    },
    {
      intent: 'work',
      confidence: 'high',
      signals: ['fix', 'implement', '修复', '实现'],
      matches: /\b(fix|implement|add|update|change|repair)\b/u.test(normalized) || /修复|实现|添加|改一下|修改/u.test(prompt)
    },
    {
      intent: 'verify',
      confidence: 'medium',
      signals: ['test', 'verify', '测试', '跑起来'],
      matches: /\b(verify|test|run tests?|check|qa)\b/u.test(normalized) || /验证|测试|跑起来/u.test(prompt)
    }
  ];

  for (const check of checks) {
    if (check.matches) {
      return {
        intent: check.intent,
        confidence: check.confidence,
        matchedSignals: matchingSignals({ prompt, normalized, signals: check.signals })
      };
    }
  }

  return {
    intent: 'work',
    confidence: 'low',
    matchedSignals: ['default-work']
  };
}

function startsWithVerify(prompt, normalized) {
  return /^\s*(跑测试|运行测试|验证|测试)/u.test(prompt)
    || /^\s*(run tests?|verify|test|check)\b/u.test(normalized);
}

function matchingSignals({ prompt, normalized, signals }) {
  return signals.filter((signal) => {
    if (/^[\x00-\x7F]+$/u.test(signal)) {
      return normalized.includes(signal);
    }

    return prompt.includes(signal);
  });
}

function defaultSafetyMode(intent) {
  if (intent === 'scan-project' || intent === 'review' || intent === 'status' || intent === 'artifacts' || intent === 'continue') {
    return 'read-only';
  }

  return 'dry-run';
}

function reasonFor({ intent, safetyMode, projectState }) {
  if (projectState.cachedContextFresh === true && ['work', 'review', 'verify'].includes(intent)) {
    return `Matched ${intent} prompt with fresh cached scan context`;
  }

  return `Matched ${intent} prompt with ${safetyMode} safety`;
}

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

function normalizeAdapter(value) {
  if (value === 'codex') {
    return 'codex';
  }

  if (value === 'claude' || value === 'claude-code') {
    return 'claude';
  }

  if (value === 'kiro' || value === 'kiro-cli') {
    return 'kiro';
  }

  return value;
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
