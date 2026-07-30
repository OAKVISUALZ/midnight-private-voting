import type { ProposalVotes } from '../voting.js';

interface ProposalListProps {
  votes: ProposalVotes[];
}

const PROPOSAL_TITLES: Record<number, string> = {
  1: 'Proposal A: Increase Treasury Allocation',
  2: 'Proposal B: Reduce Governance Threshold',
  3: 'Proposal C: Fund Community Grants',
};

export function ProposalList({ votes }: ProposalListProps) {
  return (
    <section className="card">
      <h2>Active Proposals</h2>
      {Object.entries(PROPOSAL_TITLES).map(([id, title]) => {
        const voteData = votes.find(v => v.id === Number(id));
        return (
          <div key={id} className="proposal-item">
            <span className="proposal-id">#{id}</span>
            <span>{title}</span>
            <span style={{ color: '#8891b0', fontSize: '0.85rem' }}>
              {voteData ? `${voteData.votes.toString()} votes` : '—'}
            </span>
          </div>
        );
      })}
    </section>
  );
}
