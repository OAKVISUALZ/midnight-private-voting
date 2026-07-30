async function main() {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'register':
      console.log('Registering voter...');
      break;
    case 'vote':
      console.log(`Casting vote for proposal ${args[0]}...`);
      break;
    case 'results':
      console.log('Fetching results...');
      break;
    default:
      console.log('Usage: interact <register|vote|results> [args]');
  }
}

main().catch(console.error);
