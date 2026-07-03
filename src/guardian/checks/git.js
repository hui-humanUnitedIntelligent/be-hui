// src/guardian/checks/git.js
import { makeCheck } from '../types.js';
import { fetchGitHub } from '../context.js';

/**
 * @param {import('../context.js').gatherContext extends (...args: any) => infer R ? R : never} ctx
 * @returns {Promise<import('../types.js').CheckResult[]>}
 */
export async function runGitChecks(ctx) {
  const checks = [];

  // Branch
  const branchValid = ctx.branch && ctx.branch !== 'unknown' && ctx.branch !== 'HEAD';
  checks.push(makeCheck(
    'git.branch',
    'Branch',
    'git',
    branchValid ? 'verified' : 'not_verified',
    [
      `Aktueller Branch: ${ctx.branch}`,
      `Quelle: ${ctx.github.headRef ? 'GITHUB_HEAD_REF' : 'git rev-parse'}`,
    ],
    { branch: ctx.branch },
  ));

  // Commit
  const commitValid = ctx.commit && ctx.commit !== 'unknown' && ctx.commit.length >= 7;
  checks.push(makeCheck(
    'git.commit',
    'Commit',
    'git',
    commitValid ? 'verified' : 'not_verified',
    [
      `Commit SHA: ${ctx.commit}`,
      `Kurz: ${ctx.shortCommit}`,
    ],
    { commit: ctx.commit, shortCommit: ctx.shortCommit },
  ));

  // PR-Daten von GitHub API oder Workflow-Env
  let prData = null;
  if (ctx.github.isPullRequest && ctx.github.prNumber) {
    prData = await fetchGitHub(ctx, `pulls/${ctx.github.prNumber}`);
  } else if (ctx.github.token && ctx.github.headRef && ctx.github.baseRef) {
    prData = await fetchGitHub(
      ctx,
      `pulls?head=${ctx.github.repository?.split('/')[0]}:${ctx.github.headRef}&base=${ctx.github.baseRef}&state=all`,
    );
    if (Array.isArray(prData) && prData.length > 0) prData = prData[0];
    else prData = null;
  }

  // Workflow-Env als Fallback (zuverlässiger in PR-Events)
  if (!prData && ctx.github.isPullRequest && ctx.prEnv) {
    prData = {
      number: ctx.github.prNumber,
      draft: ctx.prEnv.draft,
      merged: ctx.prEnv.merged,
      state: ctx.prEnv.state,
      mergeable: ctx.prEnv.mergeable,
      title: `PR #${ctx.github.prNumber}`,
    };
  }

  // PR vorhanden
  const prPresent = ctx.github.isPullRequest || !!prData;
  checks.push(makeCheck(
    'git.pr_present',
    'PR vorhanden',
    'git',
    prPresent ? 'verified' : (ctx.github.eventName === 'local' ? 'not_verified' : 'failed'),
    prPresent
      ? [
          `Pull Request erkannt`,
          prData ? `PR #${prData.number}: ${prData.title}` : `Event: ${ctx.github.eventName}`,
        ]
      : [
          `Kein Pull-Request-Kontext nachweisbar`,
          `Event: ${ctx.github.eventName}`,
        ],
    { prNumber: prData?.number ?? ctx.github.prNumber, title: prData?.title },
  ));

  // PR gemerged
  const prMerged = prData?.merged === true || prData?.state === 'closed' && prData?.merged_at != null;
  const onMainAfterMerge = ctx.branch === 'main' && ctx.github.isPush;
  const mergedVerified = prMerged || onMainAfterMerge;
  checks.push(makeCheck(
    'git.pr_merged',
    'PR gemerged',
    'git',
    mergedVerified ? 'verified' : (prPresent ? 'failed' : 'not_verified'),
    mergedVerified
      ? [
          prMerged ? `PR #${prData.number} merged at ${prData.merged_at}` : `Push auf main nach Merge`,
        ]
      : prPresent
        ? [`PR #${prData?.number} Status: ${prData?.state}, merged: ${prData?.merged}`]
        : [`Kein PR-Kontext — Merge-Status nicht nachweisbar`],
    { merged: prMerged, state: prData?.state },
  ));

  // Draft-Status
  const isDraft = prData?.draft === true;
  const draftCheckable = !!prData;
  checks.push(makeCheck(
    'git.draft_status',
    'Draft-Status',
    'git',
    !draftCheckable ? 'not_verified'
      : isDraft ? 'failed'
      : 'verified',
    draftCheckable
      ? [`PR Draft: ${isDraft}`]
      : [`Draft-Status nicht abrufbar (kein GITHUB_TOKEN oder kein PR)`],
    { isDraft },
  ));

  // Merge-Status
  const mergeable = prData?.mergeable;
  const mergeState = prData?.mergeable_state;
  const mergeCheckable = prData && mergeable !== undefined;
  checks.push(makeCheck(
    'git.merge_status',
    'Merge-Status',
    'git',
    !mergeCheckable ? 'not_verified'
      : mergeable === true ? 'verified'
      : 'failed',
    mergeCheckable
      ? [
          `mergeable: ${mergeable}`,
          `mergeable_state: ${mergeState}`,
        ]
      : [`Merge-Status nicht abrufbar`],
    { mergeable, mergeState },
  ));

  return checks;
}
