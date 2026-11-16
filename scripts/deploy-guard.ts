export interface RepoState {
  /** `git status --porcelain` output: empty when nothing is uncommitted or untracked. */
  uncommitted: string;
  /** The upstream branch name, or null when the branch has never been pushed. */
  upstream: string | null;
  head: string;
  upstreamHead: string | null;
}

/**
 * Why a deploy must not run, or null when it may. What is live must always be
 * a commit that is already pushed, so it can be traced and rebuilt.
 */
export function deployBlocker(state: RepoState): string | null {
  if (state.uncommitted.trim() !== "") {
    return "there are uncommitted changes. Commit and push them first.";
  }
  if (state.upstream === null) {
    return "this branch has never been pushed. Push it first: git push -u origin HEAD";
  }
  if (state.head !== state.upstreamHead) {
    return `this branch doesn't match ${state.upstream}. Push or pull first.`;
  }
  return null;
}
