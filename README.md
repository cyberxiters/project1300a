# Discord Bot Manager

A sophisticated Discord bot management platform that provides advanced authentication, monitoring, and interaction capabilities for Discord server administrators.

## Features

- Discord server integration
- Message templating system
- Campaign management
- User targeting
- Rate limiting controls
- Detailed messaging logs
- Bot token management
- Real-time monitoring

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (optional)
- **Authentication**: Passport.js, session-based auth
- **API Integration**: Discord.js

## Running Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   # Create a .env file with the following variables
   DATABASE_URL=postgresql://user:password@localhost:5432/discord_bot_manager
   SESSION_SECRET=your_session_secret
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Running on GitHub

This application is designed to be GitHub-compatible. To run it on GitHub:

1. Fork the repository
2. Set up GitHub Secrets:
   - Go to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `DATABASE_URL`: Your PostgreSQL connection string (optional)
     - `SESSION_SECRET`: A secure random string for session encryption

3. Push changes to the main branch to trigger the GitHub Actions workflow
4. View the Actions tab to monitor the workflow run
5. If you're not using a database, the application will automatically use in-memory storage

### GitHub CI/CD Setup

The repository includes:
- GitHub Actions workflow for building and testing
- Dependabot configuration for security updates
- Issue templates for bugs and feature requests
- Pull request template for contributions

To deploy from GitHub to your own hosting:
1. Fork this repository
2. Configure your hosting provider (Heroku, Vercel, etc.)
3. Connect your GitHub repository to your hosting provider
4. Add the necessary environment variables in your hosting dashboard

## Database Setup

The application can run with or without a database:

- **With Database**: Configure the `DATABASE_URL` environment variable to point to your PostgreSQL instance
- **Without Database**: The app will automatically use in-memory storage when no database is available

To run database migrations:
```bash
npm run db:push
```

## Discord Integration

To integrate with Discord:

1. Create a Discord bot at the [Discord Developer Portal](https://discord.com/developers/applications)
2. Add the bot to your server with proper permissions
3. Add your bot token in the application's Bot Token management section

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.