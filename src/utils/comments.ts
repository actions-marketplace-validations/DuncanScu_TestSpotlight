import { GitHub } from '@actions/github/lib/utils';
import { getOctokit, context } from '@actions/github/lib/github';
import { log } from './action';

type Octokit = InstanceType<typeof GitHub>;

export interface IContext {
  owner: string;
  repo: string;
  commit: string;
  issueNumber: number;
  runId: number;
}

export const publishComment = async (
  token: string,
  title: string,
  body: string,
): Promise<void> => {
  const context = getContext();
  const { owner, repo, runId, issueNumber, commit } = context;

  if (!token || !owner || !repo || issueNumber === -1) {
    log('Failed to post a comment');
    return;
  }

  const header = `## ${title}\n`; // I need a way to get around using this as it is created twice

  const octokit = getOctokit(token);
  const existingComment = await getExistingComment(octokit, context, header);

  if (existingComment) {
    await octokit.rest.issues.updateComment({ owner, repo, comment_id: existingComment.id, body });
  } else {
    await octokit.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body });
  }
};

export const getContext = (): IContext => {
  const {
    runId,
    payload: { pull_request, repository, after }
  } = context;

  const issueNumber = pull_request?.number ?? -1;
  const [owner, repo] = repository?.full_name?.split('/') || [];

  return { owner, repo, issueNumber, commit: after, runId };
};

const getExistingComment = async (octokit: Octokit, context: IContext, header: string) => {
  const { owner, repo, issueNumber } = context;
  const comments = await octokit.rest.issues.listComments({ owner, repo, issue_number: issueNumber });

  return comments.data?.find(comment => {
    const isBotUserType = comment.user?.type === 'Bot';
    const startsWithHeader = comment.body?.startsWith(header);

    return isBotUserType && startsWithHeader;
  });
};
