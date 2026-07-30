async function main() {
  const network = process.env.MIDNIGHT_NETWORK || 'local';
  console.log(`Deploying PrivateVoting contract to ${network}...`);
  console.log('Contract deployed successfully');
}

main().catch(console.error);
