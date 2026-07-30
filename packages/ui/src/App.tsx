import { VotingDashboard } from './components/VotingDashboard.js';
import { ProposalList } from './components/ProposalList.js';
import { Results } from './components/Results.js';

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>Private Voting dApp</h1>
        <p>Anonymous ballots with publicly verifiable tallies</p>
      </header>
      <main>
        <VotingDashboard />
        <ProposalList />
        <Results />
      </main>
      <footer>
        <p>Built on Midnight Network — your vote, your secret. The tally, everyone's truth.</p>
      </footer>
    </div>
  );
}
