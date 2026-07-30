import { VotingDashboard } from './components/VotingDashboard.js';
import { ProposalList } from './components/ProposalList.js';
import { Results } from './components/Results.js';
import { useWallet } from './hooks/useWallet.js';
import { useContract } from './hooks/useContract.js';

export default function App() {
  const wallet = useWallet();
  const contract = useContract();

  return (
    <div className="app">
      <header>
        <h1>Private Voting dApp</h1>
        <p>Anonymous ballots with publicly verifiable tallies</p>
        {contract.contractAddress && (
          <div className="deployed-badge">
            Deployed to Preprod: <span className="mono">{contract.contractAddress.slice(0, 24)}...</span>
          </div>
        )}
      </header>
      <main>
        <VotingDashboard
          wallet={wallet}
          contract={contract}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
          onDeploy={() => wallet.api && contract.deploy(wallet.api, wallet.address!)}
          onRegister={contract.registerVoter}
          onCastVote={contract.castVote}
        />
        <ProposalList votes={contract.proposalVotes} />
        <Results votes={contract.proposalVotes} />
      </main>
      <footer>
        <p>
          Built on Midnight Network &mdash; your vote, your secret. The tally, everyone's truth.
        </p>
      </footer>
    </div>
  );
}
