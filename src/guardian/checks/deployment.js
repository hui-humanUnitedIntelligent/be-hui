// src/guardian/checks/deployment.js
import { existsSync } from 'fs';
import { makeCheck } from '../types.js';

/**
 * @param {import('../context.js').gatherContext extends (...args: any) => infer R ? R : never} ctx
 * @returns {Promise<import('../types.js').CheckResult[]>}
 */
export async function runDeploymentChecks(ctx) {
  const checks = [];

  const hasDeploymentConfig = ctx.hasVercelConfig || existsSync(`${ctx.projectRoot}/deploy.sh`);
  const hasActiveDeployment = !!ctx.vercel.url || !!ctx.vercel.gitCommitSha;

  // Deployment vorhanden
  checks.push(makeCheck(
    'deployment.present',
    'Deployment vorhanden',
    'deployment',
    hasActiveDeployment ? 'verified' : (hasDeploymentConfig ? 'not_verified' : 'failed'),
    hasActiveDeployment
      ? [
          `VERCEL_URL: ${ctx.vercel.url || '—'}`,
          `VERCEL_ENV: ${ctx.vercel.env || '—'}`,
        ]
      : hasDeploymentConfig
        ? [
            `Deployment-Konfiguration vorhanden (vercel.json)`,
            `Kein aktives Deployment in dieser Umgebung nachweisbar`,
          ]
        : [`Keine Deployment-Konfiguration gefunden`],
    { hasConfig: hasDeploymentConfig, vercelUrl: ctx.vercel.url },
  ));

  // Deployment erfolgreich
  const deploymentSuccessful = ctx.vercel.env === 'production' && !!ctx.vercel.url;
  checks.push(makeCheck(
    'deployment.successful',
    'Deployment erfolgreich',
    'deployment',
    deploymentSuccessful ? 'verified' : 'not_verified',
    deploymentSuccessful
      ? [`Production-Deployment aktiv: ${ctx.vercel.url}`]
      : ctx.vercel.url
        ? [`Deployment-URL vorhanden, Umgebung: ${ctx.vercel.env || 'unbekannt'}`]
        : [`Deployment-Erfolg in CI ohne Vercel-Integration nicht nachweisbar`],
    { env: ctx.vercel.env, url: ctx.vercel.url },
  ));

  // Aktueller Commit deployed
  const deployedSha = ctx.vercel.gitCommitSha;
  const commitMatches = deployedSha && deployedSha.startsWith(ctx.commit.slice(0, 7))
    || deployedSha === ctx.commit;
  checks.push(makeCheck(
    'deployment.current_commit',
    'Aktueller Commit deployed',
    'deployment',
    commitMatches ? 'verified' : 'not_verified',
    deployedSha
      ? [
          `Deployed SHA: ${deployedSha}`,
          `Aktueller SHA: ${ctx.commit}`,
          `Übereinstimmung: ${commitMatches}`,
        ]
      : [`Deployed Commit SHA nicht verfügbar (VERCEL_GIT_COMMIT_SHA fehlt)`],
    { deployedSha, currentSha: ctx.commit, matches: commitMatches },
  ));

  return checks;
}
