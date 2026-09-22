const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true' && Boolean(repoName);
const isUserSite = repoName?.endsWith('.github.io');

module.exports = ({ config }) => ({
  ...config,
  web: {
    ...(config.web || {}),
    bundler: 'metro',
    output: 'single',
  },
  experiments: {
    ...(config.experiments || {}),
    ...(isGitHubPagesBuild && !isUserSite ? { baseUrl: `/${repoName}` } : {}),
  },
});
