# Discord Bot Manager

A sophisticated Discord bot management platform that provides advanced authentication, monitoring, and interaction capabilities.

## Demo & Documentation

Visit our [GitHub Pages site](https://cyberxiters.github.io/massdmbot/) for documentation and usage instructions.

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
- **Database**: PostgreSQL (with in-memory fallback)
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

## Deployment

This application can be deployed to any hosting service that supports Node.js applications. Recommended services:

- [Render](https://render.com)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)

For detailed deployment instructions, visit our [installation guide](https://cyberxiters.github.io/massdmbot/installation.html).

## Discord Integration

To integrate with Discord:

1. Create a Discord bot at the [Discord Developer Portal](https://discord.com/developers/applications)
2. Add the bot to your server with proper permissions
3. Add your bot token in the application's Bot Token management section

## License

Distributed under the MIT License.