import type { ProposalVotes } from '../voting.js';

interface ResultsProps {
  votes: ProposalVotes[];
}

const PROPOSAL_COLORS = ['#7c4dff', '#3d5afe', '#00c853'];

export function Results({ votes }: ResultsProps) {
  const maxVotes = votes.length > 0
    ? Math.max(...votes.map(v => Number(v.votes)), 1)
    : 1;

  if (votes.length === 0) {
    return (
      <section className="card">
        <h2>Live Results (Publicly Verifiable)</h2>
        <p style={{ color: '#555a7a', textAlign: 'center' }}>
          No votes cast yet. Deploy the contract and start voting to see results.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Live Results (Publicly Verifiable)</h2>
      {votes.map((r, i) => (
        <div key={r.id} className="result-bar">
          <span style={{ width: '100px' }}>Proposal #{r.id}</span>
          <div style={{ flex: 1, background: '#1e2340', borderRadius: '6px' }}>
            <div
              className="bar-fill"
              style={{
                width: `${(Number(r.votes) / maxVotes) * 100}%`,
                background: PROPOSAL_COLORS[i % PROPOSAL_COLORS.length],
              }}
            />
          </div>
          <span style={{ width: '50px', textAlign: 'right' }}>{r.votes.toString()}</span>
        </div>
      ))}
    </section>
  );
}
