import { readTextFileLimited } from './file-inventory.js';

export async function analyzeCi({ projectDir, inventory }) {
  const workflows = [];

  for (const path of inventory.ciFiles.filter((file) => file.startsWith('.github/workflows/'))) {
    const content = await readTextFileLimited(projectDir, path);
    workflows.push({
      path,
      jobs: extractGithubActionsJobs(content)
    });
  }

  return {
    providers: workflows.length > 0 ? ['github-actions'] : [],
    workflows
  };
}

function extractGithubActionsJobs(content) {
  const jobs = [];
  let inJobs = false;

  for (const line of content.split(/\r?\n/u)) {
    if (/^jobs:\s*$/u.test(line)) {
      inJobs = true;
      continue;
    }

    if (!inJobs) {
      continue;
    }

    if (/^\S/u.test(line) && !/^jobs:/u.test(line)) {
      break;
    }

    const match = /^  ([A-Za-z0-9_-]+):\s*$/u.exec(line);

    if (match) {
      jobs.push(match[1]);
    }
  }

  return jobs;
}
