import type { WalletState } from '../hooks/useWallet.js';
import type { ContractState } from '../hooks/useContract.js';

interface VotingDashboardProps {
  wallet: WalletState;
  contract: ContractState;
  onConnect: () => void;
  onDisconnect: () => void;
  onDeploy: () => void;
  onJoin: (address: string) => void;
  onRegister: () => void;
  onCastVote: (proposalId: number) => void;
}

const PROPOSAL_IDS = [1, 2, 3];

export function VotingDashboard({
  wallet,
  contract,
  onConnect,
  onDisconnect,
  onDeploy,
  onRegister,
  onCastVote,
}: VotingDashboardProps) {
  return (
    <section className="card">
      <h2>Voting Dashboard</h2>

      {wallet.error && (
        <div className="error-banner">{wallet.error}</div>
      )}

      {contract.error && (
        <div className="error-banner">{contract.error}</div>
      )}

      <div className="wallet-section">
        {!wallet.api ? (
          <div>
            {wallet.detecting ? (
              <p style={{ color: '#8891b0' }}>Detecting Midnight wallet...</p>
            ) : (
              <button onClick={onConnect} disabled={wallet.isConnecting}>
                {wallet.isConnecting ? 'Connecting...' : 'Connect Lace Wallet'}
              </button>
            )}
          </div>
        ) : (
          <div className="wallet-info">
            <div className="wallet-row">
              <span className="label">Wallet:</span>
              <span className="value mono">{wallet.address?.slice(0, 24)}...</span>
              <button className="btn-sm" onClick={onDisconnect}>
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {wallet.api && !contract.contract && (
        <div className="action-row">
          <button onClick={onDeploy} disabled={contract.isDeploying}>
            {contract.isDeploying ? 'Deploying...' : 'Deploy Contract to Preprod'}
          </button>
        </div>
      )}

      {contract.contractAddress && (
        <div className="contract-info">
          <div className="wallet-row">
            <span className="label">Contract:</span>
            <span className="value mono">{contract.contractAddress.slice(0, 24)}...</span>
          </div>
          <div className="wallet-row">
            <span className="label">Voters:</span>
            <span className="value">{contract.totalVoters.toString()}</span>
          </div>
        </div>
      )}

      {contract.contract && (
        <div className="action-row">
          <button onClick={onRegister} disabled={contract.isRegistering}>
            {contract.isRegistering ? 'Registering...' : 'Register to Vote'}
          </button>
          <span style={{ color: '#8891b0', fontSize: '0.85rem' }}>
            Your identity stays private on-chain
          </span>
        </div>
      )}

      {contract.contract && (
        <div className="action-row">
          <span style={{ color: '#8891b0', fontSize: '0.85rem', alignSelf: 'center' }}>
            Cast vote:
          </span>
          {PROPOSAL_IDS.map(id => (
            <button
              key={id}
              onClick={() => onCastVote(id)}
              disabled={contract.isVoting}
              style={{ background: '#3d5afe', flex: 1 }}
            >
              Vote #{id}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
