import { loadConfig } from './config';
import { explainError } from '../src/shared/model';
try {
  const c = await loadConfig();
  console.log(`Valid public configuration: ${c.pets.length} pets, ${c.contacts.length} contacts.`);
} catch (error) {
  console.error(explainError(error));
  process.exitCode = 1;
}
