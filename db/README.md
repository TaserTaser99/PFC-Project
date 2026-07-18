# Local prototype database

The current development prototype stores data in three JSON files created at runtime:

- `users.json`
- `friend_requests.json`
- `friendships.json`
- `credentials.json`

Run `npm run reset:demo` to create or restore demonstration users, one accepted friendship, and one pending request. The JSON files are ignored by Git.

This storage layer is suitable only for a controlled local demonstration. It uses a process-level mutation queue to reduce concurrent update problems, but it does not provide the transactions, constraints, multi-instance safety, backups, or access controls of a production database. Replace it with the team's hosted database before public onboarding.
